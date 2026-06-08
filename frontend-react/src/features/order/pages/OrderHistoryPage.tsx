import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { Button } from '@/common/components/ui/Button';
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
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-primary">My Orders</h1>

      {isLoading ? (
        <OrderListSkeleton />
      ) : !data || data.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-16 w-16 text-text-muted/60" />
          <h2 className="mt-4 text-lg font-semibold text-text-primary">No orders yet</h2>
          <p className="mt-1 text-sm text-text-secondary">Start shopping to see your orders here.</p>
          <Link to={ROUTES.PRODUCTS} className="mt-6">
            <Button>Browse Products</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.data.map((order) => (
              <Link
                key={order.id}
                to={ROUTES.ORDER_DETAIL(order.id)}
                className="shop-card block p-4 transition-all hover:border-border-strong hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Order #{order.id}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{formatDate(order.created_at)}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-text-secondary">
                      <span>{PAYMENT_METHOD_LABELS[order.payment_method]}</span>
                      <span className="text-text-muted">·</span>
                      <span>{PAYMENT_STATUS_LABELS[order.payment_status]}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <OrderStatusBadge status={order.status} />
                    <p className="mt-1.5 text-sm font-bold text-text-primary">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(data.meta.page - 1)}
                disabled={data.meta.page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-text-secondary">
                Page {data.meta.page} of {data.meta.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(data.meta.page + 1)}
                disabled={data.meta.page >= data.meta.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
