import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'emerald' | 'blue' | 'violet' | 'amber' | 'teal';
  index: number;
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

export function StatCard({ title, value, icon: Icon, color, index }: Props) {
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
        </div>
        <div className={`shrink-0 rounded-xl ${c.iconBg} p-3`}>
          <Icon className={`h-6 w-6 ${c.iconText}`} />
        </div>
      </div>
    </div>
  );
}
