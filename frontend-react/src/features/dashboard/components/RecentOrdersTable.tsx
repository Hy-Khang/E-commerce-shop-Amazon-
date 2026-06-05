import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import type { RecentOrder } from '../types/dashboard.types';

interface Props {
  orders: RecentOrder[];
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipping: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

const paymentStyles: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  unpaid: 'bg-gray-100 text-gray-600',
};

export function RecentOrdersTable({ orders }: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-jakarta text-lg font-bold text-gray-900">
        Recent Orders
      </h2>
      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No orders yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
                <th className="pb-3 pr-4">Order</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Payment</th>
                <th className="pb-3 pr-4 text-right">Amount</th>
                <th className="pb-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50">
                  <td className="py-3 pr-4">
                    <Link
                      to={ROUTES.ADMIN_ORDER_DETAIL(order.id)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      #{order.id}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-sm text-gray-700">
                    {order.customerName}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[order.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${paymentStyles[order.paymentStatus] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right text-sm font-medium tabular-nums text-gray-900">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="py-3 text-right text-xs text-gray-500">
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
