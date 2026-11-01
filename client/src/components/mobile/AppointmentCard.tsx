import { memo } from 'react';
import { CalendarDays, Clock, MoreHorizontal } from 'lucide-react';
import type { Appointment } from '../../types';
import { formatDateLong, formatTime } from '../../utils/date';
import { StatusBadge } from '../ui/StatusBadge';

interface Props {
  appointment: Appointment;
  onOpen: (a: Appointment) => void;
  onMore: (a: Appointment) => void;
}

function AppointmentCardImpl({ appointment: a, onOpen, onMore }: Props) {
  return (
    <li>
      <article className="card overflow-hidden transition-shadow">
        {/* Whole top area is a large tap target; the View Details button below is the keyboard/screen-reader equivalent. */}
        <div onClick={() => onOpen(a)} className="cursor-pointer p-4 transition-colors active:bg-slate-50">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 truncate text-base font-semibold text-slate-900">{a.customerName}</h3>
            <StatusBadge status={a.status} />
          </div>
          <p className="mt-0.5 text-sm text-slate-600">{a.service}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden />
              {formatDateLong(a.appointmentAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" aria-hidden />
              {formatTime(a.appointmentAt)}
            </span>
          </div>
        </div>
        <div className="flex gap-2 border-t border-slate-100 p-3">
          <button type="button" onClick={() => onOpen(a)}
            aria-label={`View details for ${a.customerName}`}
            className="btn-secondary min-h-11 flex-1 active:scale-[0.98]"
          >
            View Details
            <span className="sr-only">{` for ${a.customerName}`}</span>
          </button>
          <button
            type="button"
            onClick={() => onMore(a)}
            aria-label={`More actions for ${a.customerName}`}
            className="btn-secondary min-h-11 w-12 px-0 active:scale-[0.98]"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </article>
    </li>
  );
}

export const AppointmentCard = memo(AppointmentCardImpl);

export function AppointmentCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul role="status" aria-label="Loading appointments" className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="card space-y-3 p-4">
          <div className="flex justify-between">
            <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
          <div className="h-11 animate-pulse rounded-lg bg-slate-100" />
        </li>
      ))}
    </ul>
  );
}
