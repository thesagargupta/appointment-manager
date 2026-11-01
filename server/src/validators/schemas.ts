import { z } from 'zod';
import { SERVICES, STATUSES } from '../config/appointments';
import { env } from '../config/env';
import { toUtcDate } from '../utils/time';

const required = (label: string) => ({ required_error: `${label} is required`, invalid_type_error: `${label} must be text` });

export const loginSchema = z
  .object({
    email: z.string(required('Email')).trim().toLowerCase().email('Enter a valid email address').max(254),
    password: z.string(required('Password')).min(1, 'Password is required').max(200),
  })
  .strict();

export const createAppointmentSchema = z
  .object({
    customerName: z.string(required('Customer name')).trim().min(1, 'Customer name is required').max(100, 'Customer name is too long'),
    service: z
      .string(required('Service'))
      .trim()
      .min(1, 'Service is required')
      .refine((s) => (SERVICES as readonly string[]).includes(s), 'Unsupported service'),
    date: z.string(required('Date')).regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    time: z.string(required('Time')).regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm format'),
    status: z.enum(STATUSES, { errorMap: () => ({ message: `Status must be one of: ${STATUSES.join(', ')}` }) }).default('Pending'),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v.date) && /^\d{2}:\d{2}$/.test(v.time) && !toUtcDate(v.date, v.time, env.APP_TIMEZONE)) {
      ctx.addIssue({ code: 'custom', path: ['date'], message: 'Date is not a valid calendar date' });
    }
  });

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid appointment id'),
});

export const updateStatusSchema = z
  .object({
    status: z.enum(STATUSES, { errorMap: () => ({ message: `Status must be one of: ${STATUSES.join(', ')}` }) }),
  })
  .strict();

export const listQuerySchema = z.object({
  status: z
    .enum(['All', ...STATUSES], { errorMap: () => ({ message: `Status must be All or one of: ${STATUSES.join(', ')}` }) })
    .optional(),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100, 'Search is too long').optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
