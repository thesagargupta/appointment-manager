import { useEffect, type FocusEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { ChipRadioGroup } from '../components/mobile/ChipRadioGroup';
import { useAppointmentForm } from '../hooks/useAppointmentForm';
import { useIsMobile } from '../hooks/useMediaQuery';
import { STATUSES } from '../types';

/** Full-screen create form for phones (a bottom sheet would fight the on-screen keyboard). */
export default function NewAppointmentPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const leave = () => (location.key !== 'default' ? navigate(-1) : navigate('/appointments', { replace: true }));
  const { form, services, serverError, submit, reset } = useAppointmentForm(() => navigate('/appointments', { replace: true }));
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => reset(), [reset]);

  if (!isMobile) return <Navigate to="/appointments" replace />;

  // Keep the focused field clear of the keyboard / sticky submit bar.
  const keepVisible = (e: FocusEvent<HTMLFormElement>) => {
    const el = e.target;
    setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
  };

  const fieldError = (id: string, message?: string) =>
    message ? (
      <p id={id} role="alert" className="mt-1.5 text-xs text-red-600">
        {message}
      </p>
    ) : null;

  return (
    <div className="h-dvh overflow-x-clip bg-slate-50">
    <div className="flex h-full animate-page-in flex-col">
      <header className="border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center gap-2 px-2">
          <button type="button" onClick={leave} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 active:bg-slate-100">
            <X className="h-6 w-6" aria-hidden />
          </button>
          <h1 className="text-base font-semibold text-slate-900">New appointment</h1>
        </div>
      </header>

      <form id="new-appointment" onSubmit={submit} onFocusCapture={keepVisible} noValidate className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5">
        {serverError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {serverError}
          </div>
        )}
        <div>
          <label htmlFor="customerName" className="label">Customer name</label>
          <input
            id="customerName"
            className="input h-12 rounded-xl"
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="next"
            aria-invalid={!!errors.customerName}
            aria-describedby={errors.customerName ? 'customerName-error' : undefined}
            {...register('customerName')}
          />
          {fieldError('customerName-error', errors.customerName?.message)}
        </div>

        <ChipRadioGroup
          legend="Service"
          options={services.data ?? []}
          loading={services.isPending}
          emptyMessage="Could not load services. Close and try again."
          registration={register('service')}
          error={errors.service?.message}
        />

        <div className="grid grid-cols-1 gap-5 min-[400px]:grid-cols-2 min-[400px]:gap-3">
          <div>
            <label htmlFor="date" className="label">Appointment date</label>
            <input id="date" type="date" className="input h-12 rounded-xl" aria-invalid={!!errors.date} aria-describedby={errors.date ? 'date-error' : undefined} {...register('date')} />
            {fieldError('date-error', errors.date?.message)}
          </div>
          <div>
            <label htmlFor="time" className="label">Appointment time</label>
            <input id="time" type="time" className="input h-12 rounded-xl" aria-invalid={!!errors.time} aria-describedby={errors.time ? 'time-error' : undefined} {...register('time')} />
            {fieldError('time-error', errors.time?.message)}
          </div>
        </div>

        <ChipRadioGroup legend="Status" options={STATUSES} registration={register('status')} />
      </form>

      <div className="border-t border-slate-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_16px_rgba(15,23,42,0.05)]">
        <button type="submit" form="new-appointment" disabled={isSubmitting} className="btn-primary min-h-12 w-full rounded-xl text-base active:scale-[0.98]">
          {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {isSubmitting ? 'Saving…' : 'Create appointment'}
        </button>
      </div>
    </div>
    </div>
  );
}
