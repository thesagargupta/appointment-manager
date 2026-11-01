import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { ToastProvider } from '../context/ToastContext';
import type { Appointment } from '../types';

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

export const makeAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: '1',
  customerName: 'Alex Morgan',
  service: 'Consultation',
  appointmentAt: '2030-01-15T04:30:00.000Z', // 10:00 in Asia/Kolkata
  status: 'Pending',
  createdAt: '2029-12-01T00:00:00.000Z',
  updatedAt: '2029-12-01T00:00:00.000Z',
  ...overrides,
});
