export const STATUSES = ['Pending', 'Confirmed', 'Cancelled'] as const;
export type AppointmentStatus = (typeof STATUSES)[number];

// Add a service here and it becomes available in API validation and the UI (served by /api/appointments/services).
export const SERVICES = ['Consultation', 'Follow-up', 'Review'] as const;
