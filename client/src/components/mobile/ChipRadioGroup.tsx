import type { UseFormRegisterReturn } from 'react-hook-form';

interface Props {
  legend: string;
  options: readonly string[];
  registration: UseFormRegisterReturn;
  error?: string;
  loading?: boolean;
  emptyMessage?: string;
}

/** Radio group rendered as large tappable chips (real radios underneath: keyboard + screen reader friendly). */
export function ChipRadioGroup({ legend, options, registration, error, loading, emptyMessage }: Props) {
  const errorId = `${registration.name}-error`;
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="label">{legend}</legend>
      {loading ? (
        <div className="h-12 animate-pulse rounded-xl bg-slate-200" role="status" aria-label={`Loading ${legend.toLowerCase()}`} />
      ) : options.length === 0 ? (
        <p className="text-sm text-red-600">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3">
          {options.map((option) => (
            <label key={option} className="relative block">
              <input type="radio" value={option} className="peer sr-only" {...registration} />
              <span className="flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-center text-sm font-medium text-slate-700 transition-all active:scale-[0.97] peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600">
                {option}
              </span>
            </label>
          ))}
        </div>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
