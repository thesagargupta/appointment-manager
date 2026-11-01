import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, ChevronDown, LayoutDashboard, LogOut, Menu, UserCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { todayLong } from '../../utils/date';
import { MobileShell } from '../mobile/MobileShell';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays, end: false },
];

const TITLES: Record<string, string> = { '/': 'Dashboard', '/appointments': 'Appointments', '/profile': 'Profile' };

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth();
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5">
        <span className="rounded-lg bg-brand-600 p-1.5 text-white">
          <CalendarDays className="h-5 w-5" aria-hidden />
        </span>
        <span className="text-base font-semibold tracking-tight">Appointment Manager</span>
      </div>
      <nav aria-label="Main" className="flex-1 space-y-1 p-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <button
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-5 w-5" aria-hidden />
          Logout
        </button>
      </div>
    </div>
  );
}

function DesktopShell() {
  const { admin, logout } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    menuRef.current?.removeAttribute('open'); // close the account menu after navigating
  }, [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside id="mobile-sidebar" className="relative h-full w-64 max-w-[80%] shadow-xl" aria-label="Navigation">
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="absolute right-2 top-4 z-10 rounded p-1 text-slate-400 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-slate-900">{TITLES[pathname] ?? 'Appointment Manager'}</h1>
          <p className="text-xs text-slate-500 max-sm:hidden">{todayLong()}</p>
        </div>
        <details ref={menuRef} className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold uppercase text-brand-700">
              {admin?.email.charAt(0)}
            </span>
            <span className="text-sm font-medium text-slate-700 max-sm:sr-only">Administrator</span>
            <ChevronDown className="h-4 w-4 text-slate-400 max-sm:hidden" aria-hidden />
          </summary>
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <p className="truncate px-3 py-2 text-sm text-slate-500">{admin?.email}</p>
            <Link to="/profile" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <UserCircle className="h-4 w-4" aria-hidden /> View profile
            </Link>
            <button onClick={() => void logout()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </div>
        </details>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}

/** Phones get the native-style shell (bottom tabs); tablets and desktops keep the sidebar dashboard. */
export function AppLayout() {
  return useIsMobile() ? <MobileShell /> : <DesktopShell />;
}
