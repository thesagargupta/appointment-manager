import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../services/appointments';
import { makeAppointment, renderWithProviders } from '../test/utils';
import AppointmentsPage from './AppointmentsPage';

vi.mock('../services/appointments', async (orig) => ({ ...(await orig<typeof api>()), fetchAppointments: vi.fn(), fetchStats: vi.fn(), fetchServices: vi.fn(), updateAppointmentStatus: vi.fn() }));

const page = (items = [makeAppointment()]) => ({
  items,
  pagination: { page: 1, limit: 10, total: items.length, totalPages: 1 },
});
const lastFilters = () => vi.mocked(api.fetchAppointments).mock.calls.at(-1)?.[0];

beforeEach(() => {
  vi.mocked(api.fetchAppointments).mockReset().mockResolvedValue(page());
  vi.mocked(api.fetchStats).mockResolvedValue({ total: 3, pending: 1, confirmed: 1, cancelled: 1 });
  vi.mocked(api.fetchServices).mockResolvedValue(['Consultation']);
});

describe('AppointmentsPage', () => {
  it('shows a loading skeleton, then the appointments in the configured timezone', async () => {
    renderWithProviders(<AppointmentsPage />);
    expect(screen.getByRole('status', { name: /loading appointments/i })).toBeInTheDocument();
    expect(await screen.findByText('Alex Morgan')).toBeInTheDocument();
    expect(screen.getByText('15 Jan 2030')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument(); // 04:30Z rendered in Asia/Kolkata
    expect(screen.getByText('Pending', { selector: 'span' })).toBeInTheDocument();
  });

  it('shows the empty state when there are no appointments', async () => {
    vi.mocked(api.fetchAppointments).mockResolvedValue(page([]));
    renderWithProviders(<AppointmentsPage />);
    expect(await screen.findByText('No appointments yet')).toBeInTheDocument();
  });

  it('shows an error state with retry', async () => {
    vi.mocked(api.fetchAppointments).mockRejectedValueOnce(new Error('down'));
    renderWithProviders(<AppointmentsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('Alex Morgan')).toBeInTheDocument();
  });

  it('filters by status, showing counts and resetting to page 1', async () => {
    renderWithProviders(<AppointmentsPage />, { route: '/appointments?page=2' });
    await screen.findByText('Alex Morgan');
    expect(lastFilters()).toEqual({ status: 'All', search: '', page: 2 });

    const group = screen.getByRole('group', { name: /filter by status/i });
    await userEvent.click(within(group).getByRole('button', { name: /confirmed/i }));
    await waitFor(() => expect(lastFilters()).toEqual({ status: 'Confirmed', search: '', page: 1 }));
    expect(within(group).getByRole('button', { name: /confirmed/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('debounces customer-name search and combines it with the status filter', async () => {
    renderWithProviders(<AppointmentsPage />, { route: '/appointments?status=Pending' });
    await screen.findByText('Alex Morgan');
    const callsBefore = vi.mocked(api.fetchAppointments).mock.calls.length;

    await userEvent.type(screen.getByLabelText('Search by customer name'), 'alex');
    expect(vi.mocked(api.fetchAppointments).mock.calls.length).toBe(callsBefore); // nothing fired mid-typing
    await waitFor(() => expect(lastFilters()).toEqual({ status: 'Pending', search: 'alex', page: 1 }));
    expect(vi.mocked(api.fetchAppointments).mock.calls.length).toBe(callsBefore + 1);
  });

  it('updates an appointment status', async () => {
    vi.mocked(api.updateAppointmentStatus).mockResolvedValue(makeAppointment({ status: 'Confirmed' }));
    renderWithProviders(<AppointmentsPage />);
    await screen.findByText('Alex Morgan');
    await userEvent.selectOptions(screen.getByLabelText('Change status for Alex Morgan'), 'Confirmed');
    await waitFor(() => expect(api.updateAppointmentStatus).toHaveBeenCalledWith('1', 'Confirmed'));
    expect(await screen.findByText('Status updated to Confirmed.')).toBeInTheDocument();
  });
});
