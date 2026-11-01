import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { STATUSES, type Appointment, type AppointmentStatus } from '../../types';
import { formatDate, formatDateTime, formatTime } from '../../utils/date';
import { StatusBadge } from '../ui/StatusBadge';

interface Props {
  items: Appointment[];
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  updatingId?: string | null;
  readOnly?: boolean;
}

const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
const td = 'px-4 py-3 text-sm text-slate-700';

function StatusControl({ item, onChange, busy }: { item: Appointment; onChange: Props['onStatusChange']; busy: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      {busy && <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden />}
      <select
        aria-label={`Change status for ${item.customerName}`}
        value={item.status}
        disabled={busy}
        onChange={(e) => onChange(item.id, e.target.value as AppointmentStatus)}
        className="rounded-md border border-slate-300 bg-white py-1 pl-2 pr-7 text-xs text-slate-700 shadow-sm disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </span>
  );
}

function AppointmentTableImpl({ items, onStatusChange, updatingId, readOnly }: Props) {
  return (
    <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead className="border-b border-slate-200 bg-slate-50/70">
        <tr>
          <th scope="col" className={th}>Customer</th>
          <th scope="col" className={th}>Service</th>
          <th scope="col" className={th}>Date</th>
          <th scope="col" className={th}>Time</th>
          <th scope="col" className={th}>Status</th>
          <th scope="col" className={`${th} max-lg:hidden`}>Created</th>
          <th scope="col" className={`${th} max-lg:hidden`}>Updated</th>
          {!readOnly && <th scope="col" className={th}>Actions</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map((a) => (
          <tr key={a.id} className="hover:bg-slate-50/60">
            <td className={`${td} font-medium text-slate-900`}>{a.customerName}</td>
            <td className={td}>{a.service}</td>
            <td className={td}>{formatDate(a.appointmentAt)}</td>
            <td className={td}>{formatTime(a.appointmentAt)}</td>
            <td className={td}><StatusBadge status={a.status} /></td>
            <td className={`${td} max-lg:hidden`}>{formatDateTime(a.createdAt)}</td>
            <td className={`${td} max-lg:hidden`}>{formatDateTime(a.updatedAt)}</td>
            {!readOnly && (
              <td className={td}>
                <StatusControl item={a} onChange={onStatusChange} busy={updatingId === a.id} />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

export const AppointmentTable = memo(AppointmentTableImpl);

export function AppointmentTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading appointments" className="divide-y divide-slate-100">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100 max-sm:hidden" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          <div className="ml-auto h-5 w-20 animate-pulse rounded-full bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
