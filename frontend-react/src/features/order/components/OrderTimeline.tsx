import {
  Clock, CheckCircle, Truck, Package, CheckCircle2, XCircle, RotateCcw,
} from 'lucide-react';
import { formatDate } from '@/common/utils/format.util';
import { ORDER_STATUS_LABELS } from '@/common/constants/routes';
import type { StatusHistoryEntry } from '../types/order-tracking.types';

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 ring-amber-200 dark:bg-amber-500/15 dark:ring-amber-400/25' },
  confirmed: { icon: CheckCircle, color: 'text-sky-500', bg: 'bg-sky-50 ring-sky-200 dark:bg-sky-500/15 dark:ring-sky-400/25' },
  shipping: { icon: Truck, color: 'text-violet-500', bg: 'bg-violet-50 ring-violet-200 dark:bg-violet-500/15 dark:ring-violet-400/25' },
  delivered: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 ring-blue-200 dark:bg-blue-500/15 dark:ring-blue-400/25' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/15 dark:ring-emerald-400/25' },
  cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 ring-red-200 dark:bg-red-500/15 dark:ring-red-400/25' },
  return_requested: { icon: RotateCcw, color: 'text-orange-500', bg: 'bg-orange-50 ring-orange-200 dark:bg-orange-500/15 dark:ring-orange-400/25' },
};

const ACTOR_LABELS: Record<string, string> = {
  SYSTEM: 'System',
  CUSTOMER: 'Customer',
  SELLER: 'Seller',
  SHIPPER: 'Shipper',
  ADMIN: 'Admin',
};

function getActorDisplay(entry: StatusHistoryEntry): string {
  if (entry.actorType === 'SYSTEM') return 'Automatic';
  const role = ACTOR_LABELS[entry.actorType] ?? entry.actorType;
  return entry.actorName ? `${entry.actorName} (${role})` : role;
}

interface Props {
  timeline: StatusHistoryEntry[];
}

export function OrderTimeline({ timeline }: Props) {
  if (timeline.length === 0) return null;

  return (
    <div className="relative">
      {timeline.map((entry, index) => {
        const config = STATUS_CONFIG[entry.toStatus] ?? STATUS_CONFIG.pending;
        const Icon = config.icon;
        const isLast = index === timeline.length - 1;

        return (
          <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <div className="absolute left-[17px] top-10 h-[calc(100%-28px)] w-px bg-border-default" />
            )}
            <div
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ${config.bg}`}
            >
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-text-primary">
                {ORDER_STATUS_LABELS[entry.toStatus] ?? entry.toStatus}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {getActorDisplay(entry)} &middot; {formatDate(entry.createdAt)}
              </p>
              {entry.note && (
                <p className="mt-1 text-xs text-text-muted italic">{entry.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
