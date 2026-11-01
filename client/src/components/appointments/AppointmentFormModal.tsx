import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAppointmentForm } from '../../hooks/useAppointmentForm';
import type { AppointmentFormValues } from '../../schemas';
import { STATUSES } from '../../types';
import { Modal } from '../ui/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="mt-1 text-xs text-red-600">
      {message}
    </p>
  ) : null;
}

export function AppointmentFormModal({ open, onClose }: Props) {
  const { form, services, serverError, submit, reset } = useAppointmentForm(onClose);
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const describe = (name: keyof AppointmentFormValues) => (errors[name] ? `${name}-error` : undefined);

  return (
    <Modal open={open} onClose={onClose} title="Add appointment">
      <form onSubmit={submit} noValidate className="space-y-4">
        {serverError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}
        <div>
          <label htmlFor="customerName" className="label">Customer name</label>
          <input id="customerName" className="input" autoComplete="off" aria-invalid={!!errors.customerName} aria-describedby={describe('customerName')} {...register('customerName')} />
          <FieldError id="customerName-error" message={errors.customerName?.message} />
        </div>
        <div>
          <label htmlFor="service" className="label">Service</label>
          <select id="service" className="input" aria-invalid={!!errors.service} aria-describedby={describe('service')} {...register('service')}>
            <option value="">{services.isPending ? 'Loading services…' : 'Select a service'}</option>
            {services.data?.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <FieldError id="service-error" message={errors.service?.message} />
          {services.isError && <p className="mt-1 text-xs text-red-600">Could not load services. Close and reopen to retry.</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="label">Appointment date</label>
            <input id="date" type="date" className="input" aria-invalid={!!errors.date} aria-describedby={describe('date')} {...register('date')} />
            <FieldError id="date-error" message={errors.date?.message} />
          </div>
          <div>
            <label htmlFor="time" className="label">Appointment time</label>
            <input id="time" type="time" className="input" aria-invalid={!!errors.time} aria-describedby={describe('time')} {...register('time')} />
            <FieldError id="time-error" message={errors.time?.message} />
          </div>
        </div>
        <div>
          <label htmlFor="status" className="label">Status</label>
          <select id="status" className="input" {...register('status')}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {isSubmitting ? 'Saving…' : 'Create appointment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
