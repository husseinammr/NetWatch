/**
 * CyberLab — components/dashboard/ActivityFeed.tsx
 * Recent scan activity table with severity badges.
 */

'use client';

import type { RecentActivity } from '@/types';

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'badge-critical',
  high    : 'badge-high',
  medium  : 'badge-medium',
  low     : 'badge-low',
};

export default function ActivityFeed({ data }: { data: RecentActivity[] }) {
  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-slate-100">Recent Activity</h2>
        <span className="text-xs text-slate-500">{data.length} events</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 pr-4">Target</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 pr-4">Event</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 pr-4">Severity</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 pr-4">
                  <span className="font-mono text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    {item.target}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.event === 'scan:completed' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-slate-400">
                      {item.event === 'scan:completed' ? 'Completed' : 'Alert'}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  {item.severity ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${SEVERITY_BADGE[item.severity] ?? ''}`}>
                      {item.severity.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </td>
                <td className="py-3 text-right text-xs text-slate-500">{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
