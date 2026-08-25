import { Link } from 'react-router-dom';
import { Store, RotateCcw, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import type { AttentionSignals as AttentionSignalsData } from '../types/dashboard.types';

interface Props {
  signals: AttentionSignalsData;
}

interface SignalCardProps {
  icon: LucideIcon;
  count: number;
  label: string;
  to: string;
  accent: string;
  iconBg: string;
}

function SignalCard({
  icon: Icon,
  count,
  label,
  to,
  accent,
  iconBg,
}: SignalCardProps) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 rounded-xl border ${accent} p-4 transition-colors`}
    >
      <div className={`shrink-0 rounded-xl ${iconBg} p-3`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-jakarta text-2xl font-bold tabular-nums text-slate-900">
          {count}
        </p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Admin-only operator queue: shops awaiting approval + open return requests. */
export function AttentionSignals({ signals }: Props) {
  const { pendingShops, returnRequestedOrders } = signals;
  if (pendingShops === 0 && returnRequestedOrders === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {pendingShops > 0 && (
        <SignalCard
          icon={Store}
          count={pendingShops}
          label="Shops awaiting verification"
          to={`${ROUTES.ADMIN_SHOPS}?status=pending_verification`}
          accent="border-amber-200 bg-amber-50/60 hover:bg-amber-50"
          iconBg="bg-amber-100 text-amber-600"
        />
      )}
      {returnRequestedOrders > 0 && (
        <SignalCard
          icon={RotateCcw}
          count={returnRequestedOrders}
          label="Orders with a return request"
          to={`${ROUTES.ADMIN_ORDERS}?status=return_requested`}
          accent="border-rose-200 bg-rose-50/60 hover:bg-rose-50"
          iconBg="bg-rose-100 text-rose-600"
        />
      )}
    </div>
  );
}
