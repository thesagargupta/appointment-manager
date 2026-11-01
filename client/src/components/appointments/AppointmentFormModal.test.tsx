import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../services/appointments';
import { makeAppointment, renderWithProviders } from '../../test/utils';
import { AppointmentFormModal } from './AppointmentFormModal';

vi.mock('../../services/appointments');

beforeEach(() => {
  vi.mocked(api.fetchServices).mockResolvedValue(['Consultation', 'Follow-up', 'Review']);
  vi.mocked(api.createAppointment).mockReset();
});

describe('AppointmentFormModal', () => {
  it('validates required fields and blocks submission', async () => {
    renderWithProviders(<AppointmentFormModal open onClose={() => undefined} />);
    await userEvent.click(screen.getByRole('button', { name: /create appointment/i }));
    expect(await screen.findByText('Customer name is required')).toBeInTheDocument();
    expect(screen.getByText('Select a service', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Appointment date is required')).toBeInTheDocument();
    expect(screen.getByText('Appointment time is required')).toBeInTheDocument();
    expect(api.createAppointment).not.toHaveBeenCalled();
  });

  it('defaults status to Pending and submits trimmed values', async () => {
    vi.mocked(api.createAppointment).mockResolvedValue(makeAppointment());
    const onClose = vi.fn();
    renderWithProviders(<AppointmentFormModal open onClose={onClose} />);
    expect(screen.getByLabelText('Status')).toHaveValue('Pending');

    await userEvent.type(screen.getByLabelText('Customer name'), '  Alex Morgan  ');
    await screen.findByRole('option', { name: 'Review' });
    await userEvent.selectOptions(screen.getByLabelText('Service'), 'Review');
    await userEvent.type(screen.getByLabelText('Appointment date'), '2030-01-15');
    await userEvent.type(screen.getByLabelText('Appointment time'), '10:00');
    await userEvent.click(screen.getByRole('button', { name: /create appointment/i }));

    await waitFor(() =>
      expect(vi.mocked(api.createAppointment).mock.calls[0]?.[0]).toEqual({
        customerName: 'Alex Morgan',
        service: 'Review',
        date: '2030-01-15',
        time: '10:00',
        status: 'Pending',
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
