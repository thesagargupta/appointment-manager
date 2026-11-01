import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, Clock, Home, Plus, UserCircle, type LucideIcon } from 'lucide-react';
import { getLastAppointmentsQuery } from '../../hooks/useAppointmentList';
import { useStats } from '../../hooks/useAppointments';

const TEXT_ENTRY = 'input:not([type=radio]):not([type=checkbox]):not([type=button]):not([type=submit]),textarea';

/**
 * True while a text field is focused. On phones the on-screen keyboard then covers the bottom of the screen,
 * so the bar steps aside instead of floating over (or squeezing) the content.
 */
function useTextEntryFocused() {
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const onIn = (e: FocusEvent) => setFocused(e.target instanceof Element && e.target.matches(TEXT_ENTRY));
    const onOut = () => setFocused(false);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);
  return focused;
}

interface TabProps {
  to: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  badge?: number;
}

function Tab({ to, icon: Icon, label, active, badge }: TabProps) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 whitespace-nowrap text-[10.5px] font-medium transition-colors active:scale-95 ${
        active ? 'text-brand-700' : 'text-slate-500'
      }`}
    >
      <span className={`relative rounded-full px-3.5 py-1 transition-colors duration-200 ${active ? 'bg-brand-50' : ''}`}>
        <Icon className="h-5 w-5" aria-hidden />
        {!!badge && (
          <span className="absolute -right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold leading-none text-white">
            {badge > 99 ? '99+' : badge}
            <span className="sr-only"> pending</span>
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}

/** Remembered Appointments filters, but never a leftover Pending filter (that has its own tab). */
function appointmentsLink() {
  const params = new URLSearchParams(getLastAppointmentsQuery());
  if (params.get('status') === 'Pending') params.delete('status');
  const qs = params.toString();
  return `/appointments${qs ? `?${qs}` : ''}`;
}

export function BottomTabBar() {
  const typing = useTextEntryFocused();
  const { pathname, search } = useLocation();
  const stats = useStats();
  if (typing) return null;

  const onAppointments = pathname === '/appointments';
  const pendingFilter = new URLSearchParams(search).get('status') === 'Pending';

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur-md"
    >
      {/* Five equal columns: Add always sits in the exact middle with two tabs on each side. */}
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-1">
        <Tab to="/" icon={Home} label="Home" active={pathname === '/'} />
        <Tab to={appointmentsLink()} icon={CalendarDays} label="Appointments" active={onAppointments && !pendingFilter} />
        <NavLink
          to="/new"
          aria-label="Add appointment"
          className="flex min-h-14 min-w-0 flex-col items-center justify-start gap-0.5 text-[10.5px] font-medium text-brand-700"
        >
          <span className="-mt-[1.45rem] flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 ring-4 ring-white transition-transform active:scale-90">
            <Plus className="h-7 w-7" aria-hidden />
          </span>
          Add
        </NavLink>
        <Tab
          to="/appointments?status=Pending"
          icon={Clock}
          label="Pending"
          active={onAppointments && pendingFilter}
          badge={stats.data?.pending}
        />
        <Tab to="/profile" icon={UserCircle} label="Profile" active={pathname === '/profile'} />
      </div>
    </nav>
  );
}
