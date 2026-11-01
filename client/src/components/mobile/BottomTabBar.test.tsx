import { act, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../services/appointments';
import { renderWithProviders } from '../../test/utils';
import { BottomTabBar } from './BottomTabBar';

vi.mock('../../services/appointments', async (orig) => ({ ...(await orig<typeof api>()), fetchStats: vi.fn() }));

beforeEach(() => {
  vi.mocked(api.fetchStats).mockResolvedValue({ total: 5, pending: 2, confirmed: 2, cancelled: 1 });
});

describe('BottomTabBar', () => {
  it('links to real routes, marks the current tab and shows the pending count', async () => {
    renderWithProviders(<BottomTabBar />, { route: '/appointments' });
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Appointments' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Add appointment' })).toHaveAttribute('href', '/new');
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
    const pending = screen.getByRole('link', { name: /Pending/ });
    expect(pending).toHaveAttribute('href', '/appointments?status=Pending');
    expect(pending).not.toHaveAttribute('aria-current');
    expect(await screen.findByText('2')).toBeInTheDocument();
  });

  it('marks Pending (not Appointments) active on the pending filter', () => {
    renderWithProviders(<BottomTabBar />, { route: '/appointments?status=Pending' });
    expect(screen.getByRole('link', { name: /Pending/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Appointments' })).not.toHaveAttribute('aria-current');
  });

  it('steps aside while a text field is focused (on-screen keyboard)', () => {
    renderWithProviders(
      <>
        <input aria-label="field" />
        <BottomTabBar />
      </>,
    );
    const input = screen.getByLabelText('field');
    act(() => input.focus());
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();
    act(() => input.blur());
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });
});
