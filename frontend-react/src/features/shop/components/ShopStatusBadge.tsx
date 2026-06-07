import { Clock, CheckCircle2, ShieldAlert, XOctagon } from 'lucide-react';
import type { ShopStatus } from '../types/shop.types';

const config: Record<ShopStatus, {
  label: string;
  icon: typeof Clock;
  bg: string;
  text: string;
  ring: string;
  dot: string;
}> = {
  pending_verification: {
    label: 'Pending',
    icon: Clock,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
    dot: 'bg-amber-400 animate-pulse',
  },
  active: {
    label: 'Active',
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200',
    dot: 'bg-emerald-400',
  },
  suspended: {
    label: 'Suspended',
    icon: ShieldAlert,
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    ring: 'ring-orange-200',
    dot: 'bg-orange-400',
  },
  banned: {
    label: 'Banned',
    icon: XOctagon,
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    ring: 'ring-rose-200',
    dot: 'bg-rose-500',
  },
};

interface Props {
  status: ShopStatus;
  size?: 'sm' | 'md';
}

export function ShopStatusBadge({ status, size = 'sm' }: Props) {
  const c = config[status];
  const Icon = c.icon;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 font-medium ${c.bg} ${c.text} ${c.ring} ${
        isSmall ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      <Icon className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {c.label}
    </span>
  );
}
