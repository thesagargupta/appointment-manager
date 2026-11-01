import type { Stats, StatusFilter } from '../../types';

const CHIPS: { value: StatusFilter; count: (s: Stats) => number }[] = [
  { value: 'All', count: (s) => s.total },
  { value: 'Pending', count: (s) => s.pending },
  { value: 'Confirmed', count: (s) => s.confirmed },
  { value: 'Cancelled', count: (s) => s.cancelled },
];

interface Props {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
  stats?: Stats;
}

/** One horizontally scrolling row of 44px chips; never wraps. */
export function StatusChips({ value, onChange, stats }: Props) {
  return (
    <div
      role="group"
      aria-label="Filter by status"
      className="no-scrollbar relative -mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1"
    >
      {CHIPS.map((chip) => {
        const active = chip.value === value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(chip.value)}
            className={`flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all active:scale-95 ${
              active ? 'border-brand-600 bg-brand-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            {chip.value}
            {stats && (
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? 'bg-white/25' : 'bg-slate-100 text-slate-600'}`}>
                <span className="sr-only">, </span>
                {chip.count(stats)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
