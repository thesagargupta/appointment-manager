import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../context/ToastContext';
import { appointmentFormSchema, type AppointmentFormValues } from '../schemas';
import { getErrorMessage } from '../services/api';
import { useCreateAppointment, useServices } from './useAppointments';

const DEFAULTS: AppointmentFormValues = { customerName: '', service: '', date: '', time: '', status: 'Pending' };

/** Create-appointment form state shared by the desktop modal and the mobile full-screen form. */
export function useAppointmentForm(onSuccess: () => void) {
  const toast = useToast();
  const services = useServices();
  const create = useCreateAppointment();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<AppointmentFormValues>({ resolver: zodResolver(appointmentFormSchema), defaultValues: DEFAULTS });
  const { reset: resetForm } = form;

  const submit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await create.mutateAsync(values);
      toast.success('Appointment created successfully.');
      onSuccess();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  });

  const reset = useCallback(() => {
    resetForm(DEFAULTS);
    setServerError(null);
  }, [resetForm]);

  return { form, services, serverError, submit, reset };
}
