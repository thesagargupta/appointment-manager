import { CalendarCheck, CalendarClock, CalendarDays, CalendarX } from 'lucide-react';
import type { Stats } from '../../types';
import { ErrorState } from '../ui/Feedback';

const CARDS = [
  { key: 'total', label: 'Total Appointments', icon: CalendarDays, tone: 'bg-brand-50 text-brand-600' },
  { key: 'pending', label: 'Pending Appointments', icon: CalendarClock, tone: 'bg-amber-50 text-amber-600' },
  { key: 'confirmed', label: 'Confirmed Appointments', icon: CalendarCheck, tone: 'bg-emerald-50 text-emerald-600' },
  { key: 'cancelled', label: 'Cancelled Appointments', icon: CalendarX, tone: 'bg-rose-50 text-rose-600' },
] as const;

interface Props {
  stats?: Stats;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function StatsCards({ stats, isLoading, isError, onRetry }: Props) {
  if (isError && !stats) {
    return (
      <div className="card">
        <ErrorState message="Could not load statistics." onRetry={onRetry} />
      </div>
    );
  }
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, tone }) => (
        <div key={key} className="card flex items-center gap-4 p-5">
          <span className={`rounded-lg p-2.5 ${tone}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">
              {isLoading || !stats ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-slate-200" aria-label="Loading" /> : stats[key]}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
