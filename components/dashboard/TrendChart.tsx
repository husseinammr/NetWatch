/**
 * CyberLab — components/dashboard/TrendChart.tsx
 * 7-day scan activity timeline rendered as an inline SVG
 * bar chart — zero external chart library dependency.
 */

'use client';

import type { DayTrend } from '@/types';

interface Props {
  data: DayTrend[];
}

export default function TrendChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  const maxScans = Math.max(...data.map((d) => d.totalScans), 1);

  // Chart dimensions
  const W = 520;
  const H = 120;
  const BAR_W = 44;
  const GAP   = (W - data.length * BAR_W) / (data.length + 1);

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-slate-100">7-Day Scan Activity</h2>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" /> Scans
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500/70" /> Critical
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H + 40}`}
          className="w-full"
          aria-label="7-day scan trend bar chart"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
            <line
              key={frac}
              x1={0} y1={H * (1 - frac)}
              x2={W} y2={H * (1 - frac)}
              stroke="#1e293b"
              strokeWidth={1}
            />
          ))}

          {data.map((day, i) => {
            const x      = GAP + i * (BAR_W + GAP);
            const barH   = (day.totalScans / maxScans) * H;
            const critH  = day.criticalFound > 0 ? Math.max((day.criticalFound / maxScans) * H, 4) : 0;

            return (
              <g key={day.date}>
                {/* Total scans bar */}
                <rect
                  x={x}
                  y={H - barH}
                  width={BAR_W}
                  height={barH}
                  rx={4}
                  fill="rgba(16,185,129,0.35)"
                  stroke="rgba(16,185,129,0.6)"
                  strokeWidth={1}
                />

                {/* Critical overlay */}
                {critH > 0 && (
                  <rect
                    x={x}
                    y={H - critH}
                    width={BAR_W}
                    height={critH}
                    rx={4}
                    fill="rgba(239,68,68,0.55)"
                    stroke="rgba(239,68,68,0.8)"
                    strokeWidth={1}
                  />
                )}

                {/* Day label */}
                <text
                  x={x + BAR_W / 2}
                  y={H + 18}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#64748b"
                >
                  {formatDay(day.date)}
                </text>

                {/* Value label above bar */}
                {barH > 14 && (
                  <text
                    x={x + BAR_W / 2}
                    y={H - barH - 4}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#94a3b8"
                  >
                    {day.totalScans}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Numeric summary row */}
      <div className="grid grid-cols-7 gap-1 mt-2 border-t border-slate-800 pt-3">
        {data.map((day) => (
          <div key={day.date} className="text-center">
            <p className="text-xs font-mono text-slate-400">{day.totalScans}</p>
            {day.criticalFound > 0 && (
              <p className="text-[10px] text-red-500 font-mono">{day.criticalFound}c</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
