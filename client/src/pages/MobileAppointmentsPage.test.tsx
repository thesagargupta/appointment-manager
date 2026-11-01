import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../services/appointments';
import { makeAppointment, renderWithProviders } from '../test/utils';
import MobileAppointmentsPage from './MobileAppointmentsPage';

vi.mock('../services/appointments', async (orig) => ({ ...(await orig<typeof api>()), fetchAppointments: vi.fn(), fetchStats: vi.fn(), updateAppointmentStatus: vi.fn() }));

const page = (items = [makeAppointment()]) => ({ items, pagination: { page: 1, limit: 10, total: items.length, totalPages: 1 } });
const lastFilters = () => vi.mocked(api.fetchAppointments).mock.calls.at(-1)?.[0];

beforeEach(() => {
  vi.mocked(api.fetchAppointments).mockReset().mockResolvedValue(page());
  vi.mocked(api.fetchStats).mockResolvedValue({ total: 3, pending: 1, confirmed: 1, cancelled: 1 });
});

describe('MobileAppointmentsPage', () => {
  it('renders cards (not a table) with long date and time in the configured timezone', async () => {
    renderWithProviders(<MobileAppointmentsPage />);
    expect(screen.getByRole('status', { name: /loading appointments/i })).toBeInTheDocument();
    expect(await screen.findByText('Alex Morgan')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Tuesday, 15 January')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('1 appointment')).toBeInTheDocument();
  });

  it('shows an empty state for filters with no matches', async () => {
    vi.mocked(api.fetchAppointments).mockResolvedValue(page([]));
    renderWithProviders(<MobileAppointmentsPage />, { route: '/appointments?status=Pending' });
    expect(await screen.findByText('No matching appointments')).toBeInTheDocument();
  });

  it('filters with chips and combines status with a debounced search, which can be cleared', async () => {
    renderWithProviders(<MobileAppointmentsPage />);
    await screen.findByText('Alex Morgan');
    const chips = screen.getByRole('group', { name: /filter by status/i });
    await userEvent.click(within(chips).getByRole('button', { name: /confirmed/i }));
    await waitFor(() => expect(lastFilters()).toEqual({ status: 'Confirmed', search: '', page: 1 }));

    await userEvent.type(screen.getByLabelText('Search by customer name'), 'alex');
    await waitFor(() => expect(lastFilters()).toEqual({ status: 'Confirmed', search: 'alex', page: 1 }));

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    await waitFor(() => expect(lastFilters()).toEqual({ status: 'Confirmed', search: '', page: 1 }));
    expect(screen.getByLabelText('Search by customer name')).toHaveValue('');
  });

  it('opens details in a bottom sheet and changes status through the API', async () => {
    vi.mocked(api.updateAppointmentStatus).mockResolvedValue(makeAppointment({ status: 'Confirmed' }));
    renderWithProviders(<MobileAppointmentsPage />);
    await screen.findByText('Alex Morgan');
    await userEvent.click(screen.getByRole('button', { name: /view details for alex morgan/i }));

    const sheet = await screen.findByRole('dialog', { name: 'Appointment details' });
    expect(within(sheet).getByText('Consultation')).toBeInTheDocument();
    expect(within(sheet).getByText('Last updated')).toBeInTheDocument();

    await userEvent.click(within(sheet).getByRole('radio', { name: 'Confirmed' }));
    await waitFor(() => expect(api.updateAppointmentStatus).toHaveBeenCalledWith('1', 'Confirmed'));
    await waitFor(() => expect(within(sheet).getByRole('radio', { name: 'Confirmed' })).toBeChecked());
  });

  it('offers a quick status menu from the More button', async () => {
    vi.mocked(api.updateAppointmentStatus).mockResolvedValue(makeAppointment({ status: 'Cancelled' }));
    renderWithProviders(<MobileAppointmentsPage />);
    await screen.findByText('Alex Morgan');
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Alex Morgan' }));
    const sheet = await screen.findByRole('dialog', { name: 'Change status' });
    await userEvent.click(within(sheet).getByRole('radio', { name: 'Cancelled' }));
    await waitFor(() => expect(api.updateAppointmentStatus).toHaveBeenCalledWith('1', 'Cancelled'));
  });
});
