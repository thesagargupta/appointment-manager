import type { Stats, StatusFilter } from '../../types';

const TABS: { value: StatusFilter; label: string; count: (s: Stats) => number }[] = [
  { value: 'All', label: 'All', count: (s) => s.total },
  { value: 'Pending', label: 'Pending', count: (s) => s.pending },
  { value: 'Confirmed', label: 'Confirmed', count: (s) => s.confirmed },
  { value: 'Cancelled', label: 'Cancelled', count: (s) => s.cancelled },
];

interface Props {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
  stats?: Stats;
}

export function StatusFilterTabs({ value, onChange, stats }: Props) {
  return (
    <div role="group" aria-label="Filter by status" className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
      {TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
            {stats && (
              <span
                aria-label={`${tab.count(stats)} appointments`}
                className={`rounded-full px-1.5 text-xs ${active ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-600'}`}
              >
                {tab.count(stats)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
