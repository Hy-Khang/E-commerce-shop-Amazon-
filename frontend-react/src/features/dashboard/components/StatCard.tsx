import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MetricChange } from '../types/dashboard.types';

interface Props {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'emerald' | 'blue' | 'violet' | 'amber' | 'teal';
  index: number;
  /** Optional period-over-period comparison. Omit for absolute-snapshot cards. */
  trend?: MetricChange;
}

const colorMap = {
  emerald: {
    bg: 'bg-emerald-50/60',
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
  },
  blue: {
    bg: 'bg-blue-50/60',
    border: 'border-l-blue-500',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
  },
  violet: {
    bg: 'bg-violet-50/60',
    border: 'border-l-violet-500',
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-600',
  },
  amber: {
    bg: 'bg-amber-50/60',
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
  },
  teal: {
    bg: 'bg-teal-50/60',
    border: 'border-l-teal-500',
    iconBg: 'bg-teal-100',
    iconText: 'text-teal-600',
  },
};

function TrendPill({ trend }: { trend: MetricChange }) {
  const { changePercent, direction } = trend;

  if (changePercent === null) {
    // No baseline in the previous period.
    const isNew = direction === 'up';
    return (
      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-400">
        <Minus className="h-3.5 w-3.5" />
        {isNew ? 'New this period' : 'No prior data'}
      </span>
    );
  }

  const styles =
    direction === 'up'
      ? { text: 'text-emerald-600', Icon: ArrowUp }
      : direction === 'down'
        ? { text: 'text-rose-600', Icon: ArrowDown }
        : { text: 'text-slate-400', Icon: Minus };
  const { text, Icon } = styles;

  return (
    <span
      className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${text}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(changePercent).toFixed(1)}%
      <span className="font-normal text-slate-400">vs prev</span>
    </span>
  );
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  index,
  trend,
}: Props) {
  const c = colorMap[color];

  return (
    <div
      className={`animate-slide-up rounded-xl border-l-[3px] ${c.border} ${c.bg} p-5 shadow-sm`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 font-jakarta text-2xl font-bold tracking-tight text-slate-900 tabular-nums truncate">
            {value}
          </p>
          {trend && <TrendPill trend={trend} />}
        </div>
        <div className={`shrink-0 rounded-xl ${c.iconBg} p-3`}>
          <Icon className={`h-6 w-6 ${c.iconText}`} />
        </div>
      </div>
    </div>
  );
}
