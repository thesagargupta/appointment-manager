import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginSchema, type LoginValues } from '../schemas';
import { getErrorMessage } from '../services/api';

export default function LoginPage() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const from = (location.state as { from?: { pathname: string; search?: string } } | null)?.from;
  if (admin) return <Navigate to={from ? `${from.pathname}${from.search ?? ''}` : '/'} replace />;

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setServerError(null);
    try {
      await login(email, password);
      navigate(from ? `${from.pathname}${from.search ?? ''}` : '/', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Unable to sign in. Please try again.'));
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="rounded-xl bg-brand-600 p-3 text-white shadow-sm">
            <CalendarDays className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Appointment Manager</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to the administrator dashboard</p>
          </div>
        </div>
        <form onSubmit={onSubmit} noValidate className="card space-y-4 p-6">
          {serverError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" autoComplete="username" className="input" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} {...register('email')} />
            {errors.email && <p id="email-error" role="alert" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" type="password" autoComplete="current-password" className="input" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} {...register('password')} />
            {errors.password && <p id="password-error" role="alert" className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
