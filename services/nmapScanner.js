/**
 * CyberLab — services/nmapScanner.js
 * ─────────────────────────────────────────────────────────────
 * Real network scanner using Nmap via child_process.
 * Works on Windows with Nmap installed.
 *
 * ⚠️  LEGAL NOTICE:
 *     Only scan networks you OWN or have written permission
 *     to test. Unauthorized scanning is illegal.
 *
 * يتطلب:
 *   • Nmap مثبّت: https://nmap.org/download.html
 *   • تشغيل Node.js كـ Administrator على Windows
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const { exec }  = require('child_process');
const { promisify } = require('util');
const path      = require('path');
const fs        = require('fs');
const os        = require('os');
const { v4: uuidv4 } = require('uuid');

const execAsync = promisify(exec);
const { validateTarget } = require('../utils/validateTarget');

// ─── Nmap path on Windows ─────────────────────────────────────
const NMAP_PATHS = [
  'nmap',                                              // إذا موجود في PATH
  'C:\\Program Files (x86)\\Nmap\\nmap.exe',
  'C:\\Program Files\\Nmap\\nmap.exe',
];

/**
 * يجد مسار Nmap المتاح على الجهاز
 */
async function findNmap() {
  for (const nmapPath of NMAP_PATHS) {
    try {
      const cmd = `"${nmapPath}" --version`;
      const { stdout } = await execAsync(cmd, { timeout: 5000 });
      if (stdout.includes('Nmap')) {
        console.log(`[NMAP] Found at: ${nmapPath}`);
        return nmapPath;
      }
    } catch {
      continue;
    }
  }
  throw new Error(
    'Nmap غير مثبّت. حمّله من: https://nmap.org/download.html\n' +
    'ثم أعد تشغيل الـ Backend.'
  );
}

// ─── Scan Profiles ────────────────────────────────────────────
/**
 * مستويات الفحص — من السريع إلى الشامل
 */
const SCAN_PROFILES = {
  // سريع جداً — اكتشاف الأجهزة فقط
  discovery: {
    label  : 'Host Discovery',
    flags  : '-sn --host-timeout 10s',
    timeout: 30_000,
  },
  // سريع — المنافذ الشائعة
  quick: {
    label  : 'Quick Scan (Top 100 Ports)',
    flags  : '-sV --top-ports 100 --host-timeout 30s -T4',
    timeout: 60_000,
  },
  // متوسط — المنافذ الشائعة + كشف الخدمات
  standard: {
    label  : 'Standard Scan (Top 1000 Ports)',
    flags  : '-sV -sC --top-ports 1000 --host-timeout 60s -T4',
    timeout: 120_000,
  },
  // شامل — جميع المنافذ + كشف الثغرات
  vuln: {
    label  : 'Vulnerability Scan',
    flags  : '-sV -sC --script vuln --top-ports 1000 --host-timeout 120s -T4',
    timeout: 300_000,
  },
};

// ─── CVE / Vuln Severity Mapper ───────────────────────────────
/**
 * يحدد مستوى الخطورة بناءً على نتائج Nmap scripts
 */
function mapSeverity(scriptOutput = '') {
  const text = scriptOutput.toLowerCase();
  if (text.includes('critical') || text.includes('cvss: 9') || text.includes('cvss: 10')) return 'critical';
  if (text.includes('high')     || text.includes('cvss: 7') || text.includes('cvss: 8'))  return 'high';
  if (text.includes('medium')   || text.includes('cvss: 4') || text.includes('cvss: 5') || text.includes('cvss: 6')) return 'medium';
  if (text.includes('low')      || text.includes('cvss: 1') || text.includes('cvss: 2') || text.includes('cvss: 3')) return 'low';

  // منافذ معروفة الخطورة
  if (text.includes('ms17-010') || text.includes('eternalblue')) return 'critical'; // WannaCry
  if (text.includes('ms08-067'))                                   return 'critical';
  if (text.includes('smb-vuln'))                                   return 'high';
  if (text.includes('ssl-poodle') || text.includes('heartbleed'))  return 'high';
  if (text.includes('ftp-anon')   || text.includes('anonymous'))   return 'medium';
  if (text.includes('telnet'))                                      return 'medium';
  if (text.includes('http-default-accounts'))                       return 'high';

  return 'low';
}

// ─── XML Parser ───────────────────────────────────────────────
/**
 * يحلل XML output من Nmap بدون مكتبة خارجية
 * (regex بسيط — في الإنتاج استخدم xml2js)
 */
function parseNmapXML(xml) {
  const hosts = [];

  // استخراج كل host
  const hostBlocks = xml.match(/<host[\s\S]*?<\/host>/g) || [];

  for (const block of hostBlocks) {
    // حالة الجهاز
    const stateMatch = block.match(/state="([^"]+)"/);
    if (!stateMatch || stateMatch[1] !== 'up') continue;

    // IP
    const addrMatch = block.match(/<address addr="([^"]+)" addrtype="ipv4"/);
    if (!addrMatch) continue;
    const ip = addrMatch[1];

    // MAC (اختياري)
    const macMatch = block.match(/addrtype="mac" addr="([^"]+)"/);
    const mac = macMatch ? macMatch[1] : null;

    // Hostname
    const hostnameMatch = block.match(/hostname name="([^"]+)"/);
    const hostname = hostnameMatch ? hostnameMatch[1] : null;

    // OS
    const osMatch = block.match(/osmatch name="([^"]+)" accuracy="(\d+)"/);
    const os = osMatch ? { name: osMatch[1], accuracy: parseInt(osMatch[2]) } : null;

    // المنافذ المفتوحة
    const ports = [];
    const portBlocks = block.match(/<port[\s\S]*?<\/port>/g) || [];

    for (const portBlock of portBlocks) {
      const portStateMatch = portBlock.match(/portid="(\d+)"[\s\S]*?state="([^"]+)"/);
      if (!portStateMatch || portStateMatch[2] !== 'open') continue;

      const portNum  = parseInt(portStateMatch[1]);
      const protoMatch = portBlock.match(/protocol="([^"]+)"/);
      const proto    = protoMatch ? protoMatch[1] : 'tcp';

      // Service info
      const serviceMatch = portBlock.match(/service name="([^"]+)"(?:.*?product="([^"]*)")?(?:.*?version="([^"]*)")?/);
      const service  = serviceMatch ? {
        name   : serviceMatch[1] || 'unknown',
        product: serviceMatch[2] || null,
        version: serviceMatch[3] || null,
      } : { name: 'unknown', product: null, version: null };

      // Script output (vulnerabilities)
      const scriptMatches = [...portBlock.matchAll(/<script id="([^"]+)"[^>]*output="([^"]+)"/g)];
      const scripts = scriptMatches.map(m => ({
        id    : m[1],
        output: m[2].replace(/\\n/g, '\n'),
      }));

      const vulnScripts = scripts.filter(s =>
        s.id.includes('vuln') || s.id.includes('exploit') || s.id.includes('brute')
      );

      ports.push({
        port    : portNum,
        protocol: proto,
        state   : 'open',
        service,
        scripts,
        vulnScripts,
        severity: vulnScripts.length > 0
          ? mapSeverity(vulnScripts.map(s => s.output).join(' '))
          : null,
      });
    }

    // إجمالي الثغرات لهذا الجهاز
    const allVulnScripts = ports.flatMap(p => p.vulnScripts);
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    allVulnScripts.forEach(s => {
      const sev = mapSeverity(s.output);
      severityCounts[sev]++;
    });

    hosts.push({
      ip,
      mac,
      hostname,
      os,
      status     : 'up',
      openPorts  : ports.length,
      ports,
      vulnScripts: allVulnScripts,
      severity   : severityCounts,
      riskScore  : (severityCounts.critical * 40) +
                   (severityCounts.high * 20) +
                   (severityCounts.medium * 5) +
                   (severityCounts.low * 1),
    });
  }

  return hosts;
}

// ─── Main Scanner Function ────────────────────────────────────
/**
 * يشغّل Nmap ويرجع نتائج حقيقية منظّمة
 *
 * @param {object} options
 * @param {string}   options.target  - IP أو range (192.168.1.0/24)
 * @param {string}   options.profile - discovery | quick | standard | vuln
 * @param {Function} options.onProgress - callback للتقدم
 * @returns {Promise<ScanResult>}
 */
async function runNmapScan({ target, profile = 'quick', onProgress }) {
  const scanId    = uuidv4();
  const startTime = Date.now();

  // التحقق الأمني من الـ target — يمنع Command Injection
  const validation = validateTarget(target);
  if (!validation.valid) throw new Error(`Invalid target: ${validation.reason}`);

  const scanProfile = SCAN_PROFILES[profile] || SCAN_PROFILES.quick;

  console.log(`[NMAP] Scan ${scanId} starting → target=${target} profile=${profile}`);
  onProgress?.({ phase: 'init', message: `Starting ${scanProfile.label} on ${target}` });

  // إيجاد Nmap
  const nmapBin = await findNmap();

  // ملف XML مؤقت للنتائج
  const tmpXml = path.join(os.tmpdir(), `cyberlab-scan-${scanId}.xml`);

  // بناء أمر Nmap
  // -oX = XML output, --stats-every = تقدم كل 5 ثواني
  const cmd = `"${nmapBin}" ${scanProfile.flags} -oX "${tmpXml}" ${target}`;

  console.log(`[NMAP] Command: ${cmd}`);
  onProgress?.({ phase: 'scanning', message: `Running ${scanProfile.label}...` });

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      timeout  : scanProfile.timeout,
      maxBuffer: 50 * 1024 * 1024, // 50MB
    });

    onProgress?.({ phase: 'parsing', message: 'Parsing results...' });

    // قراءة XML
    let hosts = [];
    if (fs.existsSync(tmpXml)) {
      const xml = fs.readFileSync(tmpXml, 'utf8');
      hosts = parseNmapXML(xml);
    }

    const durationMs = Date.now() - startTime;

    // إجمالي الثغرات من كل الأجهزة
    const totalSeverity = hosts.reduce(
      (acc, h) => {
        acc.critical += h.severity.critical;
        acc.high     += h.severity.high;
        acc.medium   += h.severity.medium;
        acc.low      += h.severity.low;
        return acc;
      },
      { critical: 0, high: 0, medium: 0, low: 0 }
    );

    // الجهاز الأعلى خطورة
    const riskiestHost = hosts.sort((a, b) => b.riskScore - a.riskScore)[0] || null;

    // تحديد الـ event type
    const hasVulns = totalSeverity.critical > 0 || totalSeverity.high > 0 || totalSeverity.medium > 0;
    const eventType = totalSeverity.critical > 0 ? 'scan:alert'
                    : totalSeverity.high > 0     ? 'scan:alert'
                    : hasVulns                   ? 'scan:alert'
                    : 'scan:completed';

    const overallSeverity = totalSeverity.critical > 0 ? 'critical'
                          : totalSeverity.high > 0     ? 'high'
                          : totalSeverity.medium > 0   ? 'medium'
                          : totalSeverity.low > 0      ? 'low'
                          : null;

    const result = {
      scanId,
      target,
      profile      : scanProfile.label,
      status       : 'completed',
      startedAt    : new Date(startTime).toISOString(),
      completedAt  : new Date().toISOString(),
      durationMs,
      hostsFound   : hosts.length,
      hostsUp      : hosts.filter(h => h.status === 'up').length,
      totalOpenPorts: hosts.reduce((s, h) => s + h.openPorts, 0),
      findings     : totalSeverity,
      overallSeverity,
      eventType,
      riskiestHost : riskiestHost ? {
        ip       : riskiestHost.ip,
        hostname : riskiestHost.hostname,
        riskScore: riskiestHost.riskScore,
        openPorts: riskiestHost.openPorts,
      } : null,
      hosts, // كل الأجهزة بتفاصيلها الكاملة
      label: totalSeverity.critical > 0
        ? `CRITICAL: ${totalSeverity.critical} critical vulnerabilities found on ${hosts.length} hosts`
        : totalSeverity.high > 0
        ? `HIGH: ${totalSeverity.high} high-severity issues detected`
        : hasVulns
        ? `${totalSeverity.medium + totalSeverity.low} vulnerabilities found on ${hosts.length} hosts`
        : `Clean scan — ${hosts.length} hosts discovered, no vulnerabilities`,
    };

    console.log(`[NMAP] Scan ${scanId} completed → hosts=${hosts.length} critical=${totalSeverity.critical}`);
    return result;

  } finally {
    // حذف الملف المؤقت
    try { if (fs.existsSync(tmpXml)) fs.unlinkSync(tmpXml); } catch {}
  }
}

// ─── Network Interface Discovery ──────────────────────────────
/**
 * يكتشف الشبكات المحلية المتاحة على الجهاز تلقائياً
 */
function getLocalNetworks() {
  const interfaces = os.networkInterfaces();
  const networks = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        // حساب الـ network range من الـ IP و subnet
        const parts   = addr.address.split('.').map(Number);
        const mask    = addr.netmask.split('.').map(Number);
        const network = parts.map((p, i) => p & mask[i]).join('.');
        const cidr    = mask.reduce((acc, m) => acc + m.toString(2).split('').filter(b => b === '1').length, 0);

        networks.push({
          interface: name,
          ip       : addr.address,
          netmask  : addr.netmask,
          network  : `${network}/${cidr}`,
          cidr,
        });
      }
    }
  }

  return networks;
}

module.exports = { runNmapScan, getLocalNetworks, SCAN_PROFILES, findNmap };
