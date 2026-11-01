import { z } from 'zod';
import { STATUSES } from '../types';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const appointmentFormSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required').max(100, 'Customer name is too long'),
  service: z.string().min(1, 'Select a service'),
  date: z.string().min(1, 'Appointment date is required'),
  time: z.string().min(1, 'Appointment time is required'),
  status: z.enum(STATUSES),
});
export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;
