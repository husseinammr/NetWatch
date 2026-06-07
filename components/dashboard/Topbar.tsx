/**
 * CyberLab — components/dashboard/Topbar.tsx
 * Dashboard topbar: logo, live status, user info, logout.
 */

'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

const ROLE_BADGE: Record<string, string> = {
  Admin   : 'bg-red-950 text-red-400 border-red-800',
  Analyst : 'bg-blue-950 text-blue-400 border-blue-800',
  Viewer  : 'bg-slate-800 text-slate-400 border-slate-700',
};

export default function Topbar({
  isConnected,
  notificationSlot,
}: {
  isConnected: boolean;
  notificationSlot: ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-14 bg-slate-900/80 border-b border-slate-700/60 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left — logo */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
          </svg>
        </div>
        <span className="font-bold text-sm tracking-wider hidden sm:block">
          CYBER<span className="text-emerald-400">LAB</span>
        </span>
        <span className="hidden md:block text-slate-700 text-xs">|</span>
        <span className="hidden md:block text-xs text-slate-500">Security Operations</span>
      </div>

      {/* Right — status + notifications + user */}
      <div className="flex items-center gap-3">
        {/* Live connection status */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          {isConnected ? 'Live' : 'Offline'}
        </div>

        {/* Notification bell (injected from dashboard) */}
        {notificationSlot}

        {/* User pill */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-300 leading-none">{user.email}</p>
              <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border mt-0.5 ${ROLE_BADGE[user.role] ?? ROLE_BADGE.Viewer}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
