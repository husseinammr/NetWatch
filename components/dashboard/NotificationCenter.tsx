/**
 * CyberLab — components/dashboard/NotificationCenter.tsx
 * ─────────────────────────────────────────────────────────────
 * Floating real-time notification feed.
 * Renders toasts for incoming Socket.io scan events and an
 * expandable notification panel with full history.
 * ─────────────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import type { Notification } from '@/types';

// ─── Severity / type styling maps ────────────────────────────
const TYPE_STYLES: Record<string, { border: string; bg: string; icon: string; dot: string }> = {
  critical: {
    border: 'border-red-700/60',
    bg    : 'bg-red-950/70',
    icon  : 'text-red-400',
    dot   : 'bg-red-500',
  },
  warning: {
    border: 'border-orange-700/60',
    bg    : 'bg-orange-950/70',
    icon  : 'text-orange-400',
    dot   : 'bg-orange-500',
  },
  success: {
    border: 'border-emerald-700/60',
    bg    : 'bg-emerald-950/70',
    icon  : 'text-emerald-400',
    dot   : 'bg-emerald-500',
  },
  info: {
    border: 'border-blue-700/60',
    bg    : 'bg-blue-950/70',
    icon  : 'text-blue-400',
    dot   : 'bg-blue-500',
  },
};

// ─── Single toast that auto-renders for newest items ─────────
function NotificationToast({ notification }: { notification: Notification }) {
  const styles = TYPE_STYLES[notification.type] ?? TYPE_STYLES.info;

  return (
    <div
      className={`animate-slide-in-right w-80 rounded-lg border ${styles.border} ${styles.bg} backdrop-blur-sm p-3 shadow-xl shadow-black/40`}
    >
      <div className="flex items-start gap-3">
        {/* Dot */}
        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${styles.dot} ${notification.type === 'critical' ? 'animate-pulse' : ''}`} />

        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wider ${styles.icon} mb-0.5`}>
            {notification.type === 'critical' ? '⚠ CRITICAL ALERT' :
             notification.type === 'warning'  ? 'High Severity Alert' :
             notification.type === 'success'  ? 'Scan Completed' : 'Scan Started'}
          </p>
          <p className="text-sm text-slate-200 leading-snug">{notification.message}</p>
          {notification.target && (
            <p className="text-xs text-slate-500 font-mono mt-1">Target: {notification.target}</p>
          )}
          <p className="text-xs text-slate-600 mt-1">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
interface Props {
  notifications: Notification[];
  isConnected: boolean;
  onClear: () => void;
}

export default function NotificationCenter({ notifications, isConnected, onClear }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);

  // Show the 3 most recent as live toasts (only when panel is closed)
  const liveToasts  = notifications.slice(0, 3);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* ── Floating Toast Stack (bottom-right) ─────────────── */}
      {!panelOpen && liveToasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2 pointer-events-none">
          {liveToasts.map((n) => (
            <NotificationToast key={n.id} notification={n} />
          ))}
        </div>
      )}

      {/* ── Bell Button (top-right trigger) ─────────────────── */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="relative p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 transition-colors"
        aria-label="Toggle notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Notification Panel Drawer ────────────────────────── */}
      {panelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          />

          {/* Panel */}
          <div className="fixed top-0 right-0 h-full w-96 z-50 bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <div>
                <h2 className="font-semibold text-slate-100">Notification Center</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-xs text-slate-500">
                    {isConnected ? 'Live feed active' : 'Disconnected'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={onClear}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                  <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                  </svg>
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs text-center px-8">
                    Run a scan to receive real-time alerts here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {notifications.map((n) => {
                    const styles = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
                    return (
                      <div key={n.id} className="px-5 py-4 hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${styles.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-semibold uppercase tracking-wider ${styles.icon}`}>
                                {n.severity ? n.severity.toUpperCase() : n.event.replace('scan:', '')}
                              </span>
                              <span className="text-xs text-slate-600">
                                {new Date(n.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300">{n.message}</p>
                            {n.target && (
                              <p className="text-xs text-slate-500 font-mono mt-1">
                                {n.target}
                              </p>
                            )}
                            {n.scanId && (
                              <p className="text-xs text-slate-700 font-mono mt-0.5 truncate">
                                {n.scanId}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950">
              <p className="text-xs text-slate-600 text-center">
                {notifications.length} event{notifications.length !== 1 ? 's' : ''} in feed
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
