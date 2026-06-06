/**
 * CyberLab — controllers/scanController.js
 * ─────────────────────────────────────────────────────────────
 * نسخة محدّثة تستخدم Nmap الحقيقي بدل البيانات الوهمية.
 *
 *  • runScan    — يشغّل Nmap على الشبكة ويبث النتائج عبر Socket.io
 *  • getStats   — إحصائيات حقيقية من سجل الفحوصات
 *  • getHosts   — تفاصيل الأجهزة المكتشفة
 *  • getNetworks — الشبكات المحلية المتاحة
 *  • getProfiles — profiles الفحص المتاحة
 *  • getHistory  — سجل الفحوصات السابقة
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const { runNmapScan, getLocalNetworks, SCAN_PROFILES } = require('../services/nmapScanner');
const { emitScanEvent } = require('../sockets/socketManager');

// ─── In-Memory Scan History ───────────────────────────────────
const scanHistory = [];
const MAX_HISTORY = 100;

function addToHistory(result) {
  scanHistory.unshift(result);
  if (scanHistory.length > MAX_HISTORY) scanHistory.pop();
}

// ─── runScan ──────────────────────────────────────────────────
const runScan = async (req, res) => {
  const { target, profile = 'quick' } = req.body;
  const initiator = req.user;

  if (!target) {
    return res.status(400).json({
      status : 'error',
      message: 'target مطلوب. مثال: 192.168.1.0/24',
    });
  }

  if (!SCAN_PROFILES[profile]) {
    return res.status(400).json({
      status : 'error',
      message: `profile غير صالح. الخيارات: ${Object.keys(SCAN_PROFILES).join(', ')}`,
    });
  }

  // رد فوري
  res.status(202).json({
    status     : 'accepted',
    message    : 'بدأ الفحص الحقيقي. النتائج ستصل عبر WebSocket.',
    target,
    profile,
    initiatedBy: initiator.email,
    startedAt  : new Date().toISOString(),
  });

  // تشغيل Nmap في الخلفية
  (async () => {
    try {
      emitScanEvent('scan:started', {
        target,
        profile,
        initiatedBy: initiator.email,
        message    : `جاري فحص ${target} — ${SCAN_PROFILES[profile].label}`,
      });

      const result = await runNmapScan({
        target,
        profile,
        onProgress: (p) => emitScanEvent('scan:progress', { target, ...p }),
      });

      addToHistory({ ...result, initiatedBy: initiator.email });

      emitScanEvent(result.eventType, {
        scanId        : result.scanId,
        target        : result.target,
        profile       : result.profile,
        label         : result.label,
        severity      : result.overallSeverity,
        hostsFound    : result.hostsFound,
        hostsUp       : result.hostsUp,
        totalOpenPorts: result.totalOpenPorts,
        findings      : result.findings,
        riskiestHost  : result.riskiestHost,
        durationMs    : result.durationMs,
        initiatedBy   : initiator.email,
        message       : result.label,
      });

      console.log(`[SCAN] ✓ ${result.scanId} hosts=${result.hostsFound} critical=${result.findings.critical}`);

    } catch (err) {
      console.error('[SCAN] ✗', err.message);
      emitScanEvent('scan:error', {
        target,
        message: err.message,
        hint   : err.message.includes('Nmap')
          ? 'تأكد أن Nmap مثبّت وأن Node.js يعمل كـ Administrator'
          : 'فشل الفحص — راجع الـ logs',
      });
    }
  })();
};

// ─── getStats ─────────────────────────────────────────────────
const getStats = (req, res) => {
  const today    = new Date();
  const sevenDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayScans = scanHistory.filter(s => s.completedAt?.startsWith(dateStr));
    return {
      date         : dateStr,
      totalScans   : dayScans.length,
      criticalFound: dayScans.reduce((s, sc) => s + (sc.findings?.critical || 0), 0),
      highFound    : dayScans.reduce((s, sc) => s + (sc.findings?.high     || 0), 0),
      mediumFound  : dayScans.reduce((s, sc) => s + (sc.findings?.medium   || 0), 0),
      lowFound     : dayScans.reduce((s, sc) => s + (sc.findings?.low      || 0), 0),
    };
  });

  const totals = scanHistory.reduce(
    (acc, s) => {
      acc.totalScans++;
      acc.criticalFound += s.findings?.critical || 0;
      acc.highFound     += s.findings?.high     || 0;
      acc.mediumFound   += s.findings?.medium   || 0;
      acc.lowFound      += s.findings?.low      || 0;
      acc.hostsFound    += s.hostsFound         || 0;
      acc.openPorts     += s.totalOpenPorts     || 0;
      return acc;
    },
    { totalScans: 0, criticalFound: 0, highFound: 0, mediumFound: 0, lowFound: 0, hostsFound: 0, openPorts: 0 }
  );

  const totalVulns = totals.criticalFound + totals.highFound + totals.mediumFound + totals.lowFound;

  const kpis = [
    { id: 'total-scans',         label: 'إجمالي الفحوصات',  value: totals.totalScans,    change: `+${totals.totalScans}`,    trend: 'up',    icon: 'scan',   color: 'emerald' },
    { id: 'critical-alerts',     label: 'تنبيهات حرجة',     value: totals.criticalFound, change: `${totals.criticalFound}`,  trend: totals.criticalFound > 0 ? 'up' : 'stable', icon: 'alert',  color: 'red'     },
    { id: 'hosts-found',         label: 'أجهزة مكتشفة',     value: totals.hostsFound,    change: `${totals.hostsFound}`,     trend: 'stable', icon: 'server', color: 'blue'    },
    { id: 'total-vulnerabilities',label: 'إجمالي الثغرات',   value: totalVulns,           change: totalVulns > 0 ? `${totalVulns} ثغرة` : 'نظيف', trend: totalVulns > 0 ? 'up' : 'down', icon: 'shield', color: 'amber' },
  ];

  const vulnerabilityBreakdown = [
    { severity: 'Critical', count: totals.criticalFound, percentage: totalVulns ? Math.round((totals.criticalFound / totalVulns) * 100) : 0, color: '#ef4444', bgColor: '#7f1d1d' },
    { severity: 'High',     count: totals.highFound,     percentage: totalVulns ? Math.round((totals.highFound     / totalVulns) * 100) : 0, color: '#f97316', bgColor: '#7c2d12' },
    { severity: 'Medium',   count: totals.mediumFound,   percentage: totalVulns ? Math.round((totals.mediumFound   / totalVulns) * 100) : 0, color: '#eab308', bgColor: '#713f12' },
    { severity: 'Low',      count: totals.lowFound,      percentage: totalVulns ? Math.round((totals.lowFound      / totalVulns) * 100) : 0, color: '#22c55e', bgColor: '#14532d' },
  ];

  const recentActivity = scanHistory.slice(0, 10).map(s => ({
    id        : s.scanId,
    target    : s.target,
    event     : s.eventType === 'scan:completed' ? 'scan:completed' : 'scan:alert',
    severity  : s.overallSeverity || null,
    hosts     : s.hostsFound,
    time      : s.completedAt ? new Date(s.completedAt).toLocaleTimeString('ar-IQ') : 'الآن',
    durationMs: s.durationMs,
    profile   : s.profile,
  }));

  res.status(200).json({
    status: 'success',
    data  : {
      generatedAt           : new Date().toISOString(),
      windowDays            : 7,
      totalScansAllTime     : scanHistory.length,
      kpis,
      vulnerabilityBreakdown,
      sevenDayTrend         : sevenDays,
      recentActivity,
      summary: {
        totalHostsDiscovered: totals.hostsFound,
        totalOpenPorts      : totals.openPorts,
        mostRecentScan      : scanHistory[0]?.completedAt || null,
      },
    },
  });
};

// ─── getHosts ─────────────────────────────────────────────────
const getHosts = (req, res) => {
  if (scanHistory.length === 0) {
    return res.status(200).json({
      status : 'success',
      message: 'لا يوجد فحوصات بعد. شغّل Run Scan أولاً.',
      data   : { hosts: [] },
    });
  }
  const lastScan = scanHistory[0];
  res.status(200).json({
    status: 'success',
    data  : {
      scanId    : lastScan.scanId,
      target    : lastScan.target,
      scannedAt : lastScan.completedAt,
      hostsCount: lastScan.hostsFound,
      hosts     : lastScan.hosts || [],
    },
  });
};

// ─── getNetworks ──────────────────────────────────────────────
const getNetworks = (req, res) => {
  try {
    const networks = getLocalNetworks();
    res.status(200).json({ status: 'success', data: { networks } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── getProfiles ──────────────────────────────────────────────
const getProfiles = (req, res) => {
  res.status(200).json({
    status: 'success',
    data  : {
      profiles: Object.entries(SCAN_PROFILES).map(([key, val]) => ({
        key,
        label  : val.label,
        timeout: val.timeout / 1000 + 's',
      })),
    },
  });
};

// ─── getHistory ───────────────────────────────────────────────
const getHistory = (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  res.status(200).json({
    status: 'success',
    data  : {
      total: scanHistory.length,
      scans: scanHistory.slice(0, limit).map(s => ({
        scanId         : s.scanId,
        target         : s.target,
        profile        : s.profile,
        hostsFound     : s.hostsFound,
        findings       : s.findings,
        overallSeverity: s.overallSeverity,
        durationMs     : s.durationMs,
        completedAt    : s.completedAt,
        initiatedBy    : s.initiatedBy,
      })),
    },
  });
};

module.exports = { runScan, getStats, getHosts, getNetworks, getProfiles, getHistory };
