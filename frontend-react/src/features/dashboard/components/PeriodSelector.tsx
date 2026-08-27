import type { DashboardPeriod } from '../types/dashboard.types';

interface Props {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
}

const OPTIONS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '12m', label: '12M' },
];

/** Segmented control for the dashboard time window (admin design language). */
export function PeriodSelector({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Select time period"
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors ${
              active
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
