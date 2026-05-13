import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/common/constants/routes';
import { useOrders } from '../hooks/useOrders';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderListSkeleton } from '../components/OrderListSkeleton';

export default function OrderHistoryPage() {
  const { params, setPage } = usePagination({ limit: 10, sort: 'created_at', order: 'desc' });
  const { data, isLoading } = useOrders(params);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Orders</h1>

      {isLoading ? (
        <OrderListSkeleton />
      ) : !data || data.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Package className="h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">No orders yet</h2>
          <p className="mt-1 text-sm text-gray-500">Start shopping to see your orders here.</p>
          <Link
            to={ROUTES.PRODUCTS}
            className="mt-6 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.data.map((order) => (
              <Link
                key={order.id}
                to={ROUTES.ORDER_DETAIL(order.id)}
                className="block rounded-lg border bg-white p-4 transition-colors hover:border-gray-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order #{order.id}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{formatDate(order.created_at)}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span>{PAYMENT_METHOD_LABELS[order.payment_method]}</span>
                      <span>·</span>
                      <span>{PAYMENT_STATUS_LABELS[order.payment_status]}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <OrderStatusBadge status={order.status} />
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
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
        </>
      )}
    </div>
  );
}
