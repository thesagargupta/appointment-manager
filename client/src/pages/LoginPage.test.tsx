import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/utils';
import LoginPage from './LoginPage';

const loginSpy = vi.fn();
// A plain function (not a vi.fn) so the failure case can reject without the runner flagging the mock itself.
let loginImpl: (email: string, password: string) => Promise<void> = async (...args) => void loginSpy(...args);
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ admin: null, login: (email: string, password: string) => loginImpl(email, password) }),
}));

beforeEach(() => {
  loginSpy.mockReset();
  loginImpl = async (...args) => void loginSpy(...args);
});

const fillAndSubmit = async (email: string, password: string) => {
  await userEvent.type(screen.getByLabelText('Email'), email);
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
};

describe('LoginPage', () => {
  it('shows required-field messages and does not submit an empty form', async () => {
    renderWithProviders(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('toggles password visibility with the eye button', async () => {
    renderWithProviders(<LoginPage />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('rejects a malformed email', async () => {
    renderWithProviders(<LoginPage />);
    await fillAndSubmit('not-an-email', 'secret');
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('submits valid credentials', async () => {
    renderWithProviders(<LoginPage />);
    await fillAndSubmit('admin@example.com', 'secret');
    await waitFor(() => expect(loginSpy).toHaveBeenCalledWith('admin@example.com', 'secret'));
  });

  it('shows an error message when login fails', async () => {
    loginImpl = () => Promise.reject(new Error('boom'));
    renderWithProviders(<LoginPage />);
    await fillAndSubmit('admin@example.com', 'secret');
    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to sign in/i);
  });
});
