import { useCallback, useState } from 'react';
import type { SheetState } from '../components/mobile/AppointmentSheet';
import type { Appointment, AppointmentStatus } from '../types';
import { useStatusChange } from './useStatusChange';

/** State for the details / quick-status bottom sheet, wired to the real status-update API. */
export function useAppointmentSheet() {
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const { change, updatingId } = useStatusChange();

  const openDetails = useCallback((appointment: Appointment) => setSheet({ appointment, mode: 'details' }), []);
  const openStatus = useCallback((appointment: Appointment) => setSheet({ appointment, mode: 'status' }), []);
  const close = useCallback(() => setSheet(null), []);

  const onStatusChange = useCallback(
    async (id: string, status: AppointmentStatus) => {
      const updated = await change(id, status);
      if (!updated) return;
      // Details stay open showing the new status; the quick menu closes once the change is saved.
      setSheet((s) => (s && s.mode === 'details' ? { ...s, appointment: updated } : null));
    },
    [change],
  );

  return { sheet, openDetails, openStatus, close, onStatusChange, busy: updatingId !== null };
}
