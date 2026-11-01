import type { QueryFilter } from 'mongoose';
import { env } from '../config/env';
import { Appointment, type AppointmentDoc } from '../models/Appointment';
import type { AppointmentStatus } from '../config/appointments';
import type { CreateAppointmentInput, ListQuery } from '../validators/schemas';
import { HttpError } from '../utils/httpError';
import { escapeRegex, normalizeName, toUtcDate } from '../utils/time';

const PROJECTION = 'customerName service appointmentAt status createdAt updatedAt';

interface AppointmentRow {
  _id: unknown;
  customerName: string;
  service: string;
  appointmentAt: Date;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Public shape: no internal ids/fields beyond `id`.
export const toDto = (a: AppointmentRow) => ({
  id: String(a._id),
  customerName: a.customerName,
  service: a.service,
  appointmentAt: a.appointmentAt.toISOString(),
  status: a.status,
  createdAt: a.createdAt.toISOString(),
  updatedAt: a.updatedAt.toISOString(),
});

/**
 * Upcoming appointments first (soonest first), then past ones (most recent first).
 * Implemented as two index-backed queries instead of a computed sort, so it scales with the indexes.
 */
export async function listAppointments({ status, page, limit, search }: ListQuery) {
  const base: QueryFilter<AppointmentDoc> = {};
  if (status && status !== 'All') base.status = status;
  const normalized = search ? normalizeName(search) : '';
  // Escaped before use, so user input can never alter the pattern. Normalised name is already lower-case.
  if (normalized) base.customerNameNormalized = { $regex: escapeRegex(normalized) };

  const now = new Date();
  const upcoming = { ...base, appointmentAt: { $gte: now } };
  const past = { ...base, appointmentAt: { $lt: now } };

  const [upcomingTotal, pastTotal] = await Promise.all([
    Appointment.countDocuments(upcoming),
    Appointment.countDocuments(past),
  ]);
  const total = upcomingTotal + pastTotal;
  const offset = (page - 1) * limit;

  const upcomingRows =
    offset < upcomingTotal
      ? await Appointment.find(upcoming).select(PROJECTION).sort({ appointmentAt: 1, _id: 1 }).skip(offset).limit(limit).lean()
      : [];
  const remaining = limit - upcomingRows.length;
  const pastRows =
    remaining > 0 && total > offset
      ? await Appointment.find(past)
          .select(PROJECTION)
          .sort({ appointmentAt: -1, _id: 1 })
          .skip(Math.max(0, offset - upcomingTotal))
          .limit(remaining)
          .lean()
      : [];

  return {
    items: [...upcomingRows, ...pastRows].map((r) => toDto(r as unknown as AppointmentRow)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createAppointment(input: CreateAppointmentInput, adminId: string) {
  const appointmentAt = toUtcDate(input.date, input.time, env.APP_TIMEZONE);
  if (!appointmentAt) throw new HttpError(422, 'Invalid appointment date or time');
  const doc = await Appointment.create({
    customerName: input.customerName,
    service: input.service,
    appointmentAt,
    status: input.status,
    createdBy: adminId,
  });
  return toDto(doc.toObject() as unknown as AppointmentRow);
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const updated = await Appointment.findByIdAndUpdate(id, { status }, { returnDocument: 'after', runValidators: true })
    .select(PROJECTION)
    .lean();
  if (!updated) throw new HttpError(404, 'Appointment not found');
  return toDto(updated as unknown as AppointmentRow);
}

export async function getStats() {
  const rows = await Appointment.aggregate<{ _id: AppointmentStatus; count: number }>([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const by = (s: AppointmentStatus) => rows.find((r) => r._id === s)?.count ?? 0;
  const pending = by('Pending');
  const confirmed = by('Confirmed');
  const cancelled = by('Cancelled');
  return { total: pending + confirmed + cancelled, pending, confirmed, cancelled };
}
