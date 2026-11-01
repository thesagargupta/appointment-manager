import type { AppointmentStatus } from '../../types';

const STYLES: Record<AppointmentStatus, { badge: string; dot: string }> = {
  Pending: { badge: 'bg-amber-50 text-amber-800 ring-amber-600/20', dot: 'bg-amber-500' },
  Confirmed: { badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20', dot: 'bg-emerald-500' },
  Cancelled: { badge: 'bg-rose-50 text-rose-800 ring-rose-600/20', dot: 'bg-rose-500' },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {status}
    </span>
  );
}
