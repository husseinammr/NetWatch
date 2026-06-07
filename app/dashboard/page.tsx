/**
 * CyberLab — app/dashboard/page.tsx
 * ─────────────────────────────────────────────────────────────
 * الداشبورد الكامل مع دعم الفحص الحقيقي بـ Nmap
 * ─────────────────────────────────────────────────────────────
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth }   from '@/lib/authContext';
import { scanApi }   from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';

import Topbar             from '@/components/dashboard/Topbar';
import KpiCard            from '@/components/dashboard/KpiCard';
import VulnBreakdown      from '@/components/dashboard/VulnBreakdown';
import TrendChart         from '@/components/dashboard/TrendChart';
import ActivityFeed       from '@/components/dashboard/ActivityFeed';
import NotificationCenter from '@/components/dashboard/NotificationCenter';
import HostsTable         from '@/components/dashboard/HostsTable';
import ScanLauncher       from '@/components/dashboard/ScanLauncher';

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, isAuthenticated } = useAuth();

  // ── Auth guard ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  // ── Socket.io ───────────────────────────────────────────────
  const { notifications, isConnected, clearNotifications } = useSocket(token);

  // ── Stats ───────────────────────────────────────────────────
  const [stats,        setStats]        = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError,   setStatsError]   = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      setStatsLoading(true);
      setStatsError(null);
      const res = await scanApi.getStats(token);
      setStats(res.data);
    } catch (err: any) {
      setStatsError(err.message || 'فشل تحميل البيانات');
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Hosts ────────────────────────────────────────────────────
  const [hosts,        setHosts]        = useState<any[]>([]);
  const [hostsLoading, setHostsLoading] = useState(false);
  const [showHosts,    setShowHosts]    = useState(false);

  const fetchHosts = useCallback(async () => {
    if (!token) return;
    try {
      setHostsLoading(true);
      const res = await scanApi.getHosts(token);
      setHosts(res.data.hosts || []);
    } catch {
      setHosts([]);
    } finally {
      setHostsLoading(false);
    }
  }, [token]);

  // ── تحديث تلقائي عند وصول نتائج الفحص ──────────────────────
  useEffect(() => {
    const latest = notifications[0];
    if (
      latest?.event === 'scan:completed' ||
      latest?.event === 'scan:alert'
    ) {
      const t = setTimeout(() => {
        fetchStats();
        fetchHosts();
        setShowHosts(true);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [notifications, fetchStats, fetchHosts]);

  // ── Scan State ───────────────────────────────────────────────
  const [showLauncher, setShowLauncher] = useState(false);
  const [scanning,     setScanning]     = useState(false);
  const [scanStatus,   setScanStatus]   = useState<{
    type: 'info' | 'success' | 'error';
    message: string;
  } | null>(null);

  const canScan = user?.role === 'Admin' || user?.role === 'Analyst';

  const handleLaunch = async (target: string, profile: string) => {
    if (!token) return;
    try {
      setScanning(true);
      setScanStatus({ type: 'info', message: `جاري الفحص على ${target} — انتظر النتائج عبر الإشعارات...` });
      await scanApi.runScan(token, target, profile);
    } catch (err: any) {
      setScanStatus({ type: 'error', message: err.message });
      setScanning(false);
    }
  };

  // إيقاف مؤشر الفحص عند وصول الإشعار
  useEffect(() => {
    const latest = notifications[0];
    if (latest?.event === 'scan:completed' || latest?.event === 'scan:alert') {
      setScanning(false);
      setScanStatus({
        type   : latest.event === 'scan:completed' ? 'success' : 'error',
        message: latest.message,
      });
      setTimeout(() => setScanStatus(null), 8000);
    }
    if ((latest as any)?.event === 'scan:error') {
      setScanning(false);
      setScanStatus({ type: 'error', message: (latest as any).message });
    }
  }, [notifications]);

  // ── Active Tab ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'overview' | 'hosts' | 'history'>('overview');

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* خلفية grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Topbar */}
      <Topbar
        isConnected={isConnected}
        notificationSlot={
          <NotificationCenter
            notifications={notifications}
            isConnected={isConnected}
            onClear={clearNotifications}
          />
        }
      />

      {/* Scan Launcher Modal */}
      {showLauncher && token && (
        <ScanLauncher
          token={token}
          onClose={() => setShowLauncher(false)}
          onLaunch={handleLaunch}
        />
      )}

      <main className="relative flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-6 py-6 space-y-5">

        {/* ── Page Header ──────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Security Operations</h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {isConnected ? 'WebSocket متصل — استقبال لحظي' : 'WebSocket غير متصل'}
              {stats?.mostRecentScan && (
                <span className="text-slate-700">
                  · آخر فحص: {new Date(stats.mostRecentScan).toLocaleTimeString('ar-IQ')}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={fetchStats}
              disabled={statsLoading}
              title="تحديث"
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
            >
              <svg className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
              </svg>
            </button>

            {/* Run Scan */}
            {canScan && (
              <button
                onClick={() => setShowLauncher(true)}
                disabled={scanning}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {scanning ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    جاري الفحص...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    Run Scan
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Scan Status Banner ───────────────────────────── */}
        {scanStatus && (
          <div className={`p-3 rounded-lg border text-sm flex items-center gap-3 animate-fade-in-up ${
            scanStatus.type === 'success' ? 'bg-emerald-950/50 border-emerald-800/50 text-emerald-300' :
            scanStatus.type === 'error'   ? 'bg-red-950/50 border-red-800/50 text-red-300' :
                                            'bg-blue-950/50 border-blue-800/50 text-blue-300'
          }`}>
            {scanning && (
              <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
            )}
            <span className="flex-1">{scanStatus.message}</span>
            <button onClick={() => setScanStatus(null)} className="opacity-50 hover:opacity-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── Stats Error ──────────────────────────────────── */}
        {statsError && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            {statsError}
            <button onClick={fetchStats} className="ml-auto text-xs underline hover:text-red-300">إعادة المحاولة</button>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-0">
          {[
            { key: 'overview', label: 'نظرة عامة', icon: '▦' },
            { key: 'hosts',    label: 'الأجهزة',   icon: '⬡' },
            { key: 'history',  label: 'السجل',      icon: '≡' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                if (tab.key === 'hosts') fetchHosts();
              }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="mr-1.5 text-xs opacity-60">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB: Overview                                      */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* KPI Grid */}
            {statsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="card p-5 h-32 shimmer" />
                ))}
              </div>
            ) : stats?.kpis ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.kpis.map((kpi: any) => (
                  <KpiCard key={kpi.id} kpi={kpi} />
                ))}
              </div>
            ) : (
              // حالة فارغة — لم يتم فحص بعد
              <EmptyState onScan={canScan ? () => setShowLauncher(true) : undefined} />
            )}

            {/* Charts Row */}
            {stats && (stats.totalScansAllTime > 0 || stats.sevenDayTrend?.some((d: any) => d.totalScans > 0)) ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <VulnBreakdown data={stats.vulnerabilityBreakdown} />
                </div>
                <div className="lg:col-span-2">
                  <TrendChart data={stats.sevenDayTrend} />
                </div>
              </div>
            ) : null}

            {/* Activity Feed */}
            {stats?.recentActivity?.length > 0 && (
              <ActivityFeed data={stats.recentActivity} />
            )}

            {/* Role strip */}
            {user && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-900/40 border border-slate-800 rounded-lg text-xs text-slate-600">
                <span>
                  مسجّل كـ <span className="text-slate-400 font-medium">{user.email}</span>
                </span>
                <span>·</span>
                <span>
                  الدور:{' '}
                  <span className={`font-medium ${
                    user.role === 'Admin'   ? 'text-red-400'  :
                    user.role === 'Analyst' ? 'text-blue-400' : 'text-slate-400'
                  }`}>{user.role}</span>
                </span>
                <span>·</span>
                <span>
                  {user.role === 'Admin'   ? 'صلاحية كاملة' :
                   user.role === 'Analyst' ? 'فحص + مراقبة' : 'قراءة فقط'}
                </span>
                {!canScan && (
                  <>
                    <span>·</span>
                    <span className="text-amber-700">Run Scan يتطلب دور Analyst أو Admin</span>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB: Hosts                                         */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === 'hosts' && (
          <>
            {hostsLoading ? (
              <div className="card p-5 h-64 shimmer" />
            ) : (
              <HostsTable hosts={hosts} />
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB: History                                       */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <ScanHistoryTab token={token!} />
        )}

      </main>
    </div>
  );
}

// ─── Empty State Component ────────────────────────────────────
function EmptyState({ onScan }: { onScan?: () => void }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </div>
      <h3 className="text-slate-300 font-medium mb-2">لا توجد بيانات فحص بعد</h3>
      <p className="text-slate-600 text-sm mb-6 max-w-sm mx-auto">
        شغّل أول فحص لاكتشاف الأجهزة والثغرات على شبكتك المحلية
      </p>
      {onScan && (
        <button
          onClick={onScan}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
          </svg>
          ابدأ أول فحص
        </button>
      )}
    </div>
  );
}

// ─── Scan History Tab ─────────────────────────────────────────
function ScanHistoryTab({ token }: { token: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await scanApi.getHistory(token, 20);
        setHistory(res.data.scans || []);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="card p-5 h-48 shimmer" />;

  if (history.length === 0) {
    return (
      <div className="card p-10 text-center text-slate-600 text-sm">
        لا يوجد سجل فحوصات بعد
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <h2 className="font-semibold text-slate-100">سجل الفحوصات</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/50">
            <tr>
              {['الهدف', 'Profile', 'الأجهزة', 'الثغرات', 'المدة', 'بواسطة', 'الوقت'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {history.map((scan: any) => (
              <tr key={scan.scanId} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded text-emerald-400">
                    {scan.target}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{scan.profile}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-300">{scan.hostsFound}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {scan.findings?.critical > 0 && (
                      <span className="badge-critical text-[10px] px-1.5 py-0.5 rounded border">{scan.findings.critical}C</span>
                    )}
                    {scan.findings?.high > 0 && (
                      <span className="badge-high text-[10px] px-1.5 py-0.5 rounded border">{scan.findings.high}H</span>
                    )}
                    {scan.findings?.medium > 0 && (
                      <span className="badge-medium text-[10px] px-1.5 py-0.5 rounded border">{scan.findings.medium}M</span>
                    )}
                    {!scan.findings?.critical && !scan.findings?.high && !scan.findings?.medium && (
                      <span className="text-slate-600 text-xs">نظيف</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                  {scan.durationMs ? `${(scan.durationMs / 1000).toFixed(1)}s` : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{scan.initiatedBy}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {scan.completedAt ? new Date(scan.completedAt).toLocaleString('ar-IQ') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
