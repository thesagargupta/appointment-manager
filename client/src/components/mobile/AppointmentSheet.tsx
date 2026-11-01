import type { Appointment, AppointmentStatus } from '../../types';
import { formatDateLong, formatDateTime, formatTime } from '../../utils/date';
import { StatusBadge } from '../ui/StatusBadge';
import { BottomSheet } from './BottomSheet';
import { StatusPicker } from './StatusPicker';

export interface SheetState {
  appointment: Appointment;
  mode: 'details' | 'status';
}

interface Props {
  sheet: SheetState | null;
  busy: boolean;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onClose: () => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

/** Appointment details (and quick status change) as a native-style bottom sheet. */
export function AppointmentSheet({ sheet, busy, onStatusChange, onClose }: Props) {
  const a = sheet?.appointment;
  return (
    <BottomSheet open={!!sheet} onClose={onClose} title={sheet?.mode === 'status' ? 'Change status' : 'Appointment details'}>
      {a && sheet && (
        <>
          {sheet.mode === 'details' ? (
            <dl className="mb-4 divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
              <Row label="Customer">{a.customerName}</Row>
              <Row label="Service">{a.service}</Row>
              <Row label="Date">{formatDateLong(a.appointmentAt)}</Row>
              <Row label="Time">{formatTime(a.appointmentAt)}</Row>
              <Row label="Status"><StatusBadge status={a.status} /></Row>
              <Row label="Created">{formatDateTime(a.createdAt)}</Row>
              <Row label="Last updated">{formatDateTime(a.updatedAt)}</Row>
            </dl>
          ) : (
            <p className="-mt-2 mb-4 text-sm text-slate-500">
              {a.customerName} · {a.service}
            </p>
          )}
          <p className="mb-2 text-sm font-medium text-slate-700">{sheet.mode === 'details' ? 'Change status' : 'Set status to'}</p>
          <StatusPicker value={a.status} disabled={busy} onChange={(s) => onStatusChange(a.id, s)} />
          <button type="button" onClick={onClose} className="btn-secondary mt-4 min-h-12 w-full">
            Close
          </button>
        </>
      )}
    </BottomSheet>
  );
}
