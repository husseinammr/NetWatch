/**
 * CyberLab — components/dashboard/KpiCard.tsx
 * Single KPI metric card with trend indicator and icon.
 */

'use client';

import type { KPI } from '@/types';

// Icon map
function KpiIcon({ name, className }: { name: KPI['icon']; className?: string }) {
  const cls = `w-5 h-5 ${className}`;
  switch (name) {
    case 'scan':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      );
    case 'alert':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
        </svg>
      );
    case 'server':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M21.75 17.25v.75a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25v-.75M21.75 6.75v.75A2.25 2.25 0 0119.5 9.75h-15a2.25 2.25 0 01-2.25-2.25V6.75M4.5 6.75h15M4.5 12h15"/>
        </svg>
      );
    case 'shield':
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
        </svg>
      );
  }
}

// Colour token map
const COLOR_MAP: Record<KPI['color'], { icon: string; bg: string; border: string; value: string }> = {
  emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', value: 'text-emerald-300' },
  red    : { icon: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     value: 'text-red-300'     },
  blue   : { icon: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    value: 'text-blue-300'    },
  amber  : { icon: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   value: 'text-amber-300'   },
};

export default function KpiCard({ kpi }: { kpi: KPI }) {
  const c = COLOR_MAP[kpi.color];

  return (
    <div className="card p-5 hover:border-slate-600/70 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg border ${c.bg} ${c.border}`}>
          <KpiIcon name={kpi.icon} className={c.icon} />
        </div>
        {/* Trend badge */}
        <span className={`text-xs font-medium px-2 py-1 rounded-full border
          ${kpi.trend === 'up' && kpi.color === 'red'
            ? 'bg-red-950 text-red-400 border-red-800'
            : kpi.trend === 'up'
            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
            : kpi.trend === 'down'
            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
            : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
          {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'} {kpi.change}
        </span>
      </div>

      <p className={`text-3xl font-bold tabular-nums ${c.value}`}>
        {kpi.value.toLocaleString()}
      </p>
      <p className="text-sm text-slate-400 mt-1">{kpi.label}</p>
    </div>
  );
}
