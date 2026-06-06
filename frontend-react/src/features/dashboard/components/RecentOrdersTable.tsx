import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import type { RecentOrder } from '../types/dashboard.types';

interface Props {
  orders: RecentOrder[];
}

const statusDot: Record<string, string> = {
  pending: 'bg-amber-500',
  confirmed: 'bg-sky-500',
  shipping: 'bg-violet-500',
  delivered: 'bg-emerald-500',
  cancelled: 'bg-rose-500',
};

const statusText: Record<string, string> = {
  pending: 'text-amber-700',
  confirmed: 'text-sky-700',
  shipping: 'text-violet-700',
  delivered: 'text-emerald-700',
  cancelled: 'text-rose-700',
};

const paymentDot: Record<string, string> = {
  paid: 'bg-emerald-500',
  unpaid: 'bg-slate-400',
};

const paymentText: Record<string, string> = {
  paid: 'text-emerald-700',
  unpaid: 'text-slate-500',
};

export function RecentOrdersTable({ orders }: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <h2 className="mb-4 font-jakarta text-lg font-bold text-slate-900">
        Recent Orders
      </h2>
      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No orders yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase text-slate-400">
                <th className="pb-3 pr-4">Order</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Payment</th>
                <th className="pb-3 pr-4 text-right">Amount</th>
                <th className="pb-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="py-3 pr-4">
                    <Link
                      to={ROUTES.ADMIN_ORDER_DETAIL(order.id)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      #{order.id}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-sm text-slate-700">
                    {order.customerName}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusText[order.status] || 'text-slate-500'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[order.status] || 'bg-slate-400'}`} />
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${paymentText[order.paymentStatus] || 'text-slate-500'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${paymentDot[order.paymentStatus] || 'bg-slate-400'}`} />
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right text-sm font-medium tabular-nums text-slate-900">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="py-3 text-right text-xs text-slate-500">
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
