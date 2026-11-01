export const STATUSES = ['Pending', 'Confirmed', 'Cancelled'] as const;
export type AppointmentStatus = (typeof STATUSES)[number];
export type StatusFilter = 'All' | AppointmentStatus;

export interface Appointment {
  id: string;
  customerName: string;
  service: string;
  appointmentAt: string; // ISO-8601 UTC
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}

export interface Admin {
  id: string;
  email: string;
}

export interface AppointmentFilters {
  status: StatusFilter;
  search: string;
  page: number;
}

export interface CreateAppointmentPayload {
  customerName: string;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
}
