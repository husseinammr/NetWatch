/**
 * CyberLab — components/dashboard/VulnBreakdown.tsx
 * Visual severity breakdown with animated progress bars.
 */

'use client';

import type { VulnSeverity } from '@/types';

const SEVERITY_CLASSES: Record<string, string> = {
  Critical: 'bg-red-500',
  High    : 'bg-orange-500',
  Medium  : 'bg-yellow-500',
  Low     : 'bg-green-500',
};

const LABEL_CLASSES: Record<string, string> = {
  Critical: 'text-red-400',
  High    : 'text-orange-400',
  Medium  : 'text-yellow-400',
  Low     : 'text-green-400',
};

export default function VulnBreakdown({ data }: { data: VulnSeverity[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-slate-100">Vulnerability Breakdown</h2>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
          {total} total
        </span>
      </div>

      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.severity}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-sm font-medium ${LABEL_CLASSES[item.severity] ?? 'text-slate-400'}`}>
                {item.severity}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-slate-300">
                  {item.count}
                </span>
                <span className="text-xs text-slate-600">
                  {item.percentage}%
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${SEVERITY_CLASSES[item.severity] ?? 'bg-slate-500'}`}
                style={{ width: `${Math.max(item.percentage, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Mini donut legend */}
      <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 gap-2">
        {data.map((item) => (
          <div key={item.severity} className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-sm ${SEVERITY_CLASSES[item.severity] ?? 'bg-slate-500'}`}
            />
            <span className="text-xs text-slate-500">{item.severity}</span>
            <span className="text-xs font-mono text-slate-400 ml-auto">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
