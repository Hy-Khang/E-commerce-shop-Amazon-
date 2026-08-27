import { formatPrice, formatDate } from '@/common/utils/format.util';
import type { SellerRecentOrder } from '../types/dashboard.types';

interface Props {
  orders: SellerRecentOrder[];
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  shipping: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

const paymentStyles: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  unpaid: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

export function SellerRecentOrdersTable({ orders }: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <h2 className="mb-4 font-jakarta text-lg font-bold text-slate-900 dark:text-slate-100">
        Recent Orders
      </h2>
      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No orders yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <th className="pb-3 pr-4">Order</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Payment</th>
                <th className="pb-3 pr-4 text-right">Your Items</th>
                <th className="pb-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="py-3 pr-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                    #{order.id}
                  </td>
                  <td className="py-3 pr-4 text-sm text-slate-700 dark:text-slate-300">
                    {order.customerName}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[order.status] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${paymentStyles[order.paymentStatus] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">
                    {formatPrice(order.sellerSubtotal)}
                  </td>
                  <td className="py-3 text-right text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(order.createdAt)}
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
