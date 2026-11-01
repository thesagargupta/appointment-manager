import { STATUSES, type AppointmentStatus } from '../../types';

const DOT: Record<AppointmentStatus, string> = {
  Pending: 'bg-amber-500',
  Confirmed: 'bg-emerald-500',
  Cancelled: 'bg-rose-500',
};

interface Props {
  value: AppointmentStatus;
  onChange: (status: AppointmentStatus) => void;
  disabled?: boolean;
}

/** Touch-sized segmented control (44px+ targets) replacing the tiny desktop <select>. */
export function StatusPicker({ value, onChange, disabled }: Props) {
  return (
    <div role="radiogroup" aria-label="Change status" className="grid grid-cols-3 gap-2">
      {STATUSES.map((s) => {
        const selected = s === value;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => !selected && onChange(s)}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl border text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-60 ${
              selected ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${DOT[s]}`} aria-hidden />
            {s}
          </button>
        );
      })}
    </div>
  );
}
