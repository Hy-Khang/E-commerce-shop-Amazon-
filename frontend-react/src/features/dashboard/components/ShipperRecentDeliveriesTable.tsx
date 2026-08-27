import { Link } from 'react-router-dom';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import type { ShipperRecentDelivery } from '../types/dashboard.types';

interface Props {
  deliveries: ShipperRecentDelivery[];
}

const statusStyles: Record<string, string> = {
  shipping: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  delivered: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

export function ShipperRecentDeliveriesTable({ deliveries }: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <h2 className="mb-4 font-jakarta text-lg font-bold text-slate-900 dark:text-slate-100">
        Recent Deliveries
      </h2>
      {deliveries.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No deliveries yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <th className="pb-3 pr-4">Order</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4 text-right">Total</th>
                <th className="pb-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="py-3 pr-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                    <Link
                      to={ROUTES.SHIPPER_DELIVERY_DETAIL(delivery.id)}
                      className="hover:text-emerald-600 transition-colors dark:hover:text-emerald-400"
                    >
                      #{delivery.id}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-sm text-slate-700 dark:text-slate-300">
                    {delivery.customerName}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[delivery.status] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
                    >
                      {delivery.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">
                    {formatPrice(delivery.totalAmount)}
                  </td>
                  <td className="py-3 text-right text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(delivery.deliveredAt || delivery.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
