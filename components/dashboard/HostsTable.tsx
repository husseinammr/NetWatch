/**
 * CyberLab — components/dashboard/HostsTable.tsx
 * جدول الأجهزة المكتشفة من الفحص الحقيقي
 */

'use client';

import { useState } from 'react';

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'badge-critical',
  high    : 'badge-high',
  medium  : 'badge-medium',
  low     : 'badge-low',
};

const RISK_COLOR = (score: number) => {
  if (score >= 40) return 'text-red-400';
  if (score >= 20) return 'text-orange-400';
  if (score >= 5)  return 'text-yellow-400';
  return 'text-green-400';
};

interface Port {
  port    : number;
  protocol: string;
  service : { name: string; product: string | null; version: string | null };
  severity: string | null;
}

interface Host {
  ip        : string;
  hostname  : string | null;
  mac       : string | null;
  os        : { name: string; accuracy: number } | null;
  openPorts : number;
  ports     : Port[];
  riskScore : number;
  severity  : { critical: number; high: number; medium: number; low: number };
}

export default function HostsTable({ hosts }: { hosts: Host[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!hosts || hosts.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="text-slate-600 mb-3">
          <svg className="w-12 h-12 mx-auto opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 014.5-4.5h13.5a4.5 4.5 0 014.5 4.5"/>
          </svg>
        </div>
        <p className="text-slate-500 text-sm">لا توجد أجهزة بعد</p>
        <p className="text-slate-600 text-xs mt-1">شغّل فحصاً لاكتشاف الأجهزة على الشبكة</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="font-semibold text-slate-100">الأجهزة المكتشفة</h2>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
          {hosts.length} جهاز
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/50">
            <tr>
              {['IP', 'Hostname', 'OS', 'منافذ مفتوحة', 'الثغرات', 'Risk Score', ''].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {hosts.map((host) => (
              <>
                <tr
                  key={host.ip}
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === host.ip ? null : host.ip)}
                >
                  {/* IP */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded text-emerald-400">
                      {host.ip}
                    </span>
                  </td>

                  {/* Hostname */}
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {host.hostname || <span className="text-slate-700">—</span>}
                  </td>

                  {/* OS */}
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-[160px] truncate">
                    {host.os
                      ? <span title={host.os.name}>{host.os.name.split(' ').slice(0, 3).join(' ')}</span>
                      : <span className="text-slate-700">غير معروف</span>}
                  </td>

                  {/* Open Ports */}
                  <td className="px-4 py-3">
                    <span className="text-slate-300 font-mono text-xs">{host.openPorts}</span>
                  </td>

                  {/* Vulnerabilities */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {host.severity.critical > 0 && (
                        <span className="badge-critical text-xs px-1.5 py-0.5 rounded border">
                          {host.severity.critical}C
                        </span>
                      )}
                      {host.severity.high > 0 && (
                        <span className="badge-high text-xs px-1.5 py-0.5 rounded border">
                          {host.severity.high}H
                        </span>
                      )}
                      {host.severity.medium > 0 && (
                        <span className="badge-medium text-xs px-1.5 py-0.5 rounded border">
                          {host.severity.medium}M
                        </span>
                      )}
                      {host.severity.low > 0 && (
                        <span className="badge-low text-xs px-1.5 py-0.5 rounded border">
                          {host.severity.low}L
                        </span>
                      )}
                      {!host.severity.critical && !host.severity.high &&
                       !host.severity.medium && !host.severity.low && (
                        <span className="text-slate-600 text-xs">نظيف</span>
                      )}
                    </div>
                  </td>

                  {/* Risk Score */}
                  <td className="px-4 py-3">
                    <span className={`font-mono font-bold text-sm ${RISK_COLOR(host.riskScore)}`}>
                      {host.riskScore}
                    </span>
                  </td>

                  {/* Expand toggle */}
                  <td className="px-4 py-3 text-right">
                    <svg
                      className={`w-4 h-4 text-slate-600 transition-transform inline-block ${expanded === host.ip ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </td>
                </tr>

                {/* ── Expanded: Port Details ─────────────── */}
                {expanded === host.ip && (
                  <tr key={`${host.ip}-detail`} className="bg-slate-900/60">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* MAC + OS */}
                        <div className="space-y-2">
                          {host.mac && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500 w-16">MAC:</span>
                              <span className="font-mono text-slate-300">{host.mac}</span>
                            </div>
                          )}
                          {host.os && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500 w-16">OS:</span>
                              <span className="text-slate-300">{host.os.name}</span>
                              <span className="text-slate-600">({host.os.accuracy}%)</span>
                            </div>
                          )}
                        </div>

                        {/* Open Ports Table */}
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">المنافذ المفتوحة</p>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {host.ports.slice(0, 20).map((port) => (
                              <div key={port.port} className="flex items-center gap-2 text-xs bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="font-mono text-blue-400 w-14">
                                  {port.port}/{port.protocol}
                                </span>
                                <span className="text-slate-400 flex-1">
                                  {port.service.product || port.service.name}
                                  {port.service.version && <span className="text-slate-600 ml-1">{port.service.version}</span>}
                                </span>
                                {port.severity && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${SEVERITY_BADGE[port.severity] || ''}`}>
                                    {port.severity.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            ))}
                            {host.ports.length > 20 && (
                              <p className="text-xs text-slate-600 text-center pt-1">
                                +{host.ports.length - 20} منفذ آخر
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
