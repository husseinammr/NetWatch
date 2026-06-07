/**
 * CyberLab — components/dashboard/ScanLauncher.tsx
 * مودال تشغيل الفحص — مناسب لجميع أحجام الشاشات
 */

'use client';

import { useState, useEffect } from 'react';
import { scanApi, type Network, type ScanProfile } from '@/lib/api';

interface Props {
  token    : string;
  onClose  : () => void;
  onLaunch : (target: string, profile: string) => void;
}

const PROFILE_DESCRIPTIONS: Record<string, string> = {
  discovery: 'اكتشاف الأجهزة فقط — 30 ثانية',
  quick    : 'أشهر 100 منفذ — دقيقة',
  standard : 'أشهر 1000 منفذ — دقيقتين',
  vuln     : 'فحص ثغرات كامل — 5 دقائق',
};

const PROFILE_COLORS: Record<string, string> = {
  discovery: 'border-blue-700 bg-blue-950/40 text-blue-300',
  quick    : 'border-emerald-700 bg-emerald-950/40 text-emerald-300',
  standard : 'border-yellow-700 bg-yellow-950/40 text-yellow-300',
  vuln     : 'border-red-700 bg-red-950/40 text-red-300',
};

const PROFILE_INACTIVE = 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600';

export default function ScanLauncher({ token, onClose, onLaunch }: Props) {
  const [target,   setTarget]   = useState('');
  const [profile,  setProfile]  = useState('quick');
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [netsRes, profRes] = await Promise.all([
          scanApi.getNetworks(token),
          scanApi.getProfiles(token),
        ]);
        setNetworks(netsRes.data.networks);
        if (netsRes.data.networks.length > 0) {
          setTarget(netsRes.data.networks[0].network);
        }
      } catch {}
    })();
  }, [token]);

  const handleLaunch = () => {
    if (!target.trim()) return;
    setLoading(true);
    onLaunch(target.trim(), profile);
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — في وسط الشاشة تماماً */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/70 flex flex-col max-h-[90vh]">

          {/* Header — ثابت */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <h2 className="font-semibold text-slate-100 text-sm">تشغيل فحص حقيقي</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Body — قابل للـ scroll */}
          <div className="overflow-y-auto flex-1 p-5 space-y-4">

            {/* Target */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                الهدف (TARGET)
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="192.168.1.0/24"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
              />

              {/* الشبكات المكتشفة */}
              {networks.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-slate-600 mb-1.5">شبكاتك المحلية:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {networks.map((net) => (
                      <button
                        key={net.network}
                        onClick={() => setTarget(net.network)}
                        className={`text-xs font-mono px-2 py-1 rounded border transition-colors ${
                          target === net.network
                            ? 'bg-emerald-950 border-emerald-700 text-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {net.network} <span className="opacity-50">({net.interface})</span>
                      </button>
                    ))}
                    <button
                      onClick={() => setTarget('127.0.0.1')}
                      className={`text-xs font-mono px-2 py-1 rounded border transition-colors ${
                        target === '127.0.0.1'
                          ? 'bg-emerald-950 border-emerald-700 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      127.0.0.1 (localhost)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                نوع الفحص
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PROFILE_DESCRIPTIONS).map(([key, desc]) => (
                  <button
                    key={key}
                    onClick={() => setProfile(key)}
                    className={`text-left p-2.5 rounded-lg border transition-colors ${
                      profile === key ? PROFILE_COLORS[key] : PROFILE_INACTIVE
                    }`}
                  >
                    <p className="text-xs font-semibold capitalize mb-0.5">{key}</p>
                    <p className="text-[10px] opacity-70 leading-snug">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* تحذير */}
            <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg">
              <svg className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
              </svg>
              <p className="text-[11px] text-amber-600/80">
                افحص فقط الشبكات التي تملكها أو لديك إذن بفحصها.
              </p>
            </div>
          </div>

          {/* Footer — زر التشغيل ثابت في الأسفل */}
          <div className="px-5 py-3 border-t border-slate-800 shrink-0">
            <button
              onClick={handleLaunch}
              disabled={!target.trim() || loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  جاري التشغيل...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
                  </svg>
                  ابدأ الفحص الحقيقي
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}