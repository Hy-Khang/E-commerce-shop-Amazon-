import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import type { LowStockAlert } from '../types/dashboard.types';

interface Props {
  alerts: LowStockAlert[];
}

function stockSeverity(qty: number): string {
  if (qty === 0) return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25';
  if (qty <= 5) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25';
  return 'bg-amber-50/50 text-amber-600 border-amber-200 dark:bg-amber-500/5 dark:text-amber-400 dark:border-amber-500/20';
}

function stockBadge(qty: number): string {
  if (qty === 0) return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300';
  if (qty <= 5) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
  return 'bg-amber-100/50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400';
}

export function SellerLowStockAlerts({ alerts }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h2 className="font-jakarta text-lg font-bold text-slate-900 dark:text-slate-100">
          Low Stock Alerts
        </h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          {alerts.length}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {alerts.map((alert) => {
          const variant = [alert.option1, alert.option2].filter(Boolean).join(' / ');
          return (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 ${stockSeverity(alert.stockQuantity)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    to={ROUTES.SELLER_PRODUCTS}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {alert.productName}
                  </Link>
                  <p className="mt-0.5 truncate text-xs opacity-70">
                    {alert.sku}{variant ? ` — ${variant}` : ''}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${stockBadge(alert.stockQuantity)}`}
                >
                  {alert.stockQuantity}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
