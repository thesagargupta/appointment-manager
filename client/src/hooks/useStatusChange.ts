import { useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import type { Appointment, AppointmentStatus } from '../types';
import { useUpdateStatus } from './useAppointments';

/** Status update with success/error toasts. `change` resolves to the updated appointment, or null on failure. */
export function useStatusChange() {
  const toast = useToast();
  const { mutateAsync, isPending, variables } = useUpdateStatus();

  const change = useCallback(
    async (id: string, status: AppointmentStatus): Promise<Appointment | null> => {
      try {
        const updated = await mutateAsync({ id, status });
        toast.success(`Status updated to ${status}.`);
        return updated;
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not update the status.'));
        return null;
      }
    },
    [mutateAsync, toast],
  );

  return { change, updatingId: isPending ? variables.id : null };
}
