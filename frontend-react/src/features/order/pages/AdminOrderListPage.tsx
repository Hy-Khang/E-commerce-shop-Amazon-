import { Link, useSearchParams } from 'react-router-dom';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/common/constants/routes';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import type { AdminOrderListParams, OrderStatus, PaymentStatus } from '../types/order.types';

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
const PAYMENT_OPTIONS: PaymentStatus[] = ['unpaid', 'paid'];

export default function AdminOrderListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const filters: AdminOrderListParams = {
    ...params,
    status: (searchParams.get('status') as OrderStatus) || undefined,
    payment_status: (searchParams.get('payment_status') as PaymentStatus) || undefined,
    user_id: searchParams.get('user_id') ? Number(searchParams.get('user_id')) : undefined,
  };

  const { data, isLoading } = useAdminOrders(filters);

  function handleFilterChange(key: string, value: string) {
    setSearchParams((prev) => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      <div className="flex flex-wrap gap-3">
        <select
          value={searchParams.get('status') || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select
          value={searchParams.get('payment_status') || ''}
          onChange={(e) => handleFilterChange('payment_status', e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Payments</option>
          {PAYMENT_OPTIONS.map((s) => (
            <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Order</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Payment</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.data.length > 0 ? (
              data.data.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">#{order.id}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {PAYMENT_STATUS_LABELS[order.payment_status]}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={ROUTES.ADMIN_ORDER_DETAIL(order.id)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(data.meta.page - 1)}
            disabled={data.meta.page <= 1}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <button
            onClick={() => setPage(data.meta.page + 1)}
            disabled={data.meta.page >= data.meta.totalPages}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
