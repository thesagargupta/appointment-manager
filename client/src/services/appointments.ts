import type {
  Admin,
  Appointment,
  AppointmentFilters,
  AppointmentStatus,
  CreateAppointmentPayload,
  Pagination,
  Stats,
} from '../types';
import { api, setCsrfToken } from './api';

export const PAGE_SIZE = 10;

export async function login(email: string, password: string): Promise<Admin> {
  const res = await api.post<{ data: { admin: Admin; csrfToken: string } }>('/auth/login', { email, password });
  setCsrfToken(res.data.data.csrfToken);
  return res.data.data.admin;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    setCsrfToken(null);
  }
}

export async function fetchMe(): Promise<Admin | null> {
  try {
    const res = await api.get<{ data: { admin: Admin } }>('/auth/me');
    return res.data.data.admin;
  } catch (err) {
    if ((err as { response?: { status?: number } }).response?.status === 401) return null;
    throw err;
  }
}

export async function fetchAppointments(filters: AppointmentFilters, limit = PAGE_SIZE) {
  const params: Record<string, string | number> = { page: filters.page, limit };
  if (filters.status !== 'All') params.status = filters.status;
  if (filters.search.trim()) params.search = filters.search.trim();
  const res = await api.get<{ data: Appointment[]; pagination: Pagination }>('/appointments', { params });
  return { items: res.data.data, pagination: res.data.pagination };
}

export async function createAppointment(payload: CreateAppointmentPayload) {
  const res = await api.post<{ data: Appointment }>('/appointments', payload);
  return res.data.data;
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const res = await api.patch<{ data: Appointment }>(`/appointments/${id}/status`, { status });
  return res.data.data;
}

export async function fetchServices() {
  const res = await api.get<{ data: string[] }>('/appointments/services');
  return res.data.data;
}

export async function fetchStats() {
  const res = await api.get<{ data: Stats }>('/dashboard/stats');
  return res.data.data;
}
