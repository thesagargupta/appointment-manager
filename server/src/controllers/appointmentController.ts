import type { Request, Response } from 'express';
import { SERVICES } from '../config/appointments';
import * as service from '../services/appointmentService';
import { sendSuccess } from '../utils/response';
import type { CreateAppointmentInput, ListQuery } from '../validators/schemas';

export async function list(req: Request, res: Response) {
  const { items, pagination } = await service.listAppointments(req.query as unknown as ListQuery);
  sendSuccess(res, 'Appointments retrieved successfully', items, { pagination });
}

export async function create(req: Request, res: Response) {
  const appointment = await service.createAppointment(req.body as CreateAppointmentInput, req.session.adminId as string);
  sendSuccess(res, 'Appointment created successfully', appointment, { status: 201 });
}

export async function updateStatus(req: Request, res: Response) {
  const appointment = await service.updateAppointmentStatus(req.params.id as string, req.body.status);
  sendSuccess(res, 'Appointment status updated successfully', appointment);
}

export async function services(_req: Request, res: Response) {
  sendSuccess(res, 'Services retrieved successfully', SERVICES);
}

export async function stats(_req: Request, res: Response) {
  sendSuccess(res, 'Dashboard statistics retrieved successfully', await service.getStats());
}
