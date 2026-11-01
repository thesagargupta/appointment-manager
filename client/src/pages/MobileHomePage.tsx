import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarClock, CalendarDays, CalendarX, ChevronRight, Plus, type LucideIcon } from 'lucide-react';
import { AppointmentCard, AppointmentCardSkeleton } from '../components/mobile/AppointmentCard';
import { AppointmentSheet } from '../components/mobile/AppointmentSheet';
import { EmptyState, ErrorState } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useAppointments, useStats } from '../hooks/useAppointments';
import { useAppointmentSheet } from '../hooks/useAppointmentSheet';
import type { Stats } from '../types';
import { greeting, todayLong } from '../utils/date';

const UPCOMING_FILTERS = { status: 'All', search: '', page: 1 } as const;

const CARDS: { key: keyof Stats; label: string; to: string; icon: LucideIcon; tone: string }[] = [
  { key: 'total', label: 'Total', to: '/appointments', icon: CalendarDays, tone: 'bg-brand-50 text-brand-600' },
  { key: 'pending', label: 'Pending', to: '/appointments?status=Pending', icon: CalendarClock, tone: 'bg-amber-50 text-amber-600' },
  { key: 'confirmed', label: 'Confirmed', to: '/appointments?status=Confirmed', icon: CalendarCheck, tone: 'bg-emerald-50 text-emerald-600' },
  { key: 'cancelled', label: 'Cancelled', to: '/appointments?status=Cancelled', icon: CalendarX, tone: 'bg-rose-50 text-rose-600' },
];

export default function MobileHomePage() {
  const { admin } = useAuth();
  const stats = useStats();
  const upcoming = useAppointments(UPCOMING_FILTERS, 5);
  const { sheet, openDetails, openStatus, close, onStatusChange, busy } = useAppointmentSheet();
  const name = admin?.email.split('@')[0];

  return (
    <>
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          {greeting()}
          {name && <span className="text-brand-600">, {name}</span>}
        </h2>
        <p className="text-sm text-slate-500">{todayLong()}</p>
      </section>

      <section aria-label="Summary">
        {stats.isError && !stats.data ? (
          <div className="card">
            <ErrorState message="Could not load statistics." onRetry={() => void stats.refetch()} />
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {CARDS.map(({ key, label, to, icon: Icon, tone }) => (
              <li key={key}>
                <Link to={to} className="card flex min-h-[4.5rem] items-center gap-3 p-3.5 transition-transform active:scale-[0.97]">
                  <span className={`rounded-xl p-2 ${tone}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-slate-500">{label}</span>
                    <span className="block text-xl font-semibold tabular-nums text-slate-900">
                      {stats.data ? stats.data[key] : <span className="inline-block h-6 w-8 animate-pulse rounded bg-slate-200" aria-label="Loading" />}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Quick actions" className="grid grid-cols-2 gap-3">
        <Link to="/new" className="btn-primary min-h-12 rounded-xl active:scale-[0.97]">
          <Plus className="h-5 w-5" aria-hidden /> New appointment
        </Link>
        <Link to="/appointments?status=Pending" className="btn-secondary min-h-12 rounded-xl active:scale-[0.97]">
          Review pending
        </Link>
      </section>

      <section aria-labelledby="upcoming-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="upcoming-heading" className="text-base font-semibold text-slate-900">Upcoming</h2>
          <Link to="/appointments" className="inline-flex min-h-11 items-center gap-0.5 text-sm font-medium text-brand-600">
            View all <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {upcoming.isPending ? (
          <AppointmentCardSkeleton count={2} />
        ) : upcoming.isError ? (
          <div className="card">
            <ErrorState message="Could not load appointments." onRetry={() => void upcoming.refetch()} />
          </div>
        ) : upcoming.data.items.length === 0 ? (
          <div className="card">
            <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No appointments yet">
              Tap Add to create your first appointment.
            </EmptyState>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.data.items.map((a) => (
              <AppointmentCard key={a.id} appointment={a} onOpen={openDetails} onMore={openStatus} />
            ))}
          </ul>
        )}
      </section>

      <AppointmentSheet sheet={sheet} busy={busy} onStatusChange={onStatusChange} onClose={close} />
    </>
  );
}
