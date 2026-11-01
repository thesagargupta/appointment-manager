import { Link, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BottomTabBar } from './BottomTabBar';

const TITLES: Record<string, string> = { '/': 'Home', '/appointments': 'Appointments', '/profile': 'Profile' };

/** Phone layout: compact header, scrollable content with room for the tab bar, fixed bottom tabs. */
export function MobileShell() {
  const { pathname } = useLocation();
  const { admin } = useAuth();
  return (
    <div className="min-h-dvh overflow-x-clip bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4">
          <span className="rounded-lg bg-brand-600 p-1.5 text-white">
            <CalendarDays className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">Appointment Manager</p>
            <h1 className="truncate text-base font-semibold text-slate-900">{TITLES[pathname] ?? 'Not found'}</h1>
          </div>
          <Link
            to="/profile"
            aria-label="Profile"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold uppercase text-brand-700 active:scale-95"
          >
            {admin?.email.charAt(0)}
          </Link>
        </div>
      </header>
      {/* key = pathname replays the enter transition on each tab switch (cached queries mean no refetch). */}
      <main key={pathname} className="animate-page-in space-y-4 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}
