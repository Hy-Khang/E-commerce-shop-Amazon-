import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Star } from 'lucide-react';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/common/constants/routes';
import { ReviewForm } from '@/features/review';
import { useOrder } from '../hooks/useOrder';
import { useCancelOrder } from '../hooks/useCancelOrder';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderItemRow } from '../components/OrderItemRow';
import { isOrderCancellable, getPaymentStatusColor } from '../utils/order.util';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { data: order, isLoading, isError } = useOrder(orderId);
  const cancelOrder = useCancelOrder();
  const [reviewingItemId, setReviewingItemId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p>Order not found.</p>
        <Link to={ROUTES.ORDERS} className="mt-4 text-sm text-blue-600 hover:text-blue-800">
          Back to orders
        </Link>
      </div>
    );
  }

  function handleCancel() {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrder.mutate(orderId);
    }
  }

  const isDelivered = order.status === 'delivered';

  return (
    <div>
      <Link
        to={ROUTES.ORDERS}
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
          <p className="mt-1 text-sm text-gray-500">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {isOrderCancellable(order.status) && (
            <button
              onClick={handleCancel}
              disabled={cancelOrder.isPending}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {cancelOrder.isPending ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Items ({order.order_items.length})
            </h2>
            {order.order_items.map((item) => (
              <div key={item.id}>
                <OrderItemRow item={item} />
                {isDelivered && item.product_id && (
                  <div className="pb-4 pl-20">
                    {reviewingItemId === item.id ? (
                      <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">Write a Review</h3>
                          <button
                            onClick={() => setReviewingItemId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                        <ReviewForm
                          productId={item.product_id}
                          orderId={orderId}
                          onSuccess={() => setReviewingItemId(null)}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewingItemId(item.id)}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Star className="h-3.5 w-3.5" />
                        Write a Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Payment & Shipping Info */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Info</h2>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Payment</dt>
                <dd className="font-medium text-gray-900">
                  {PAYMENT_METHOD_LABELS[order.payment_method]}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Payment Status</dt>
                <dd>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                    {PAYMENT_STATUS_LABELS[order.payment_status]}
                  </span>
                </dd>
              </div>
              <div className="border-t pt-3">
                <dt className="mb-1 text-gray-500">Shipping Address</dt>
                <dd className="text-gray-900">
                  <p className="font-medium">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.phone}</p>
                  <p>{order.shipping_address.address_line}</p>
                  <p>{order.shipping_address.city}</p>
                </dd>
              </div>
            </dl>
          </div>

          {/* Order Total */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.total_amount - order.shipping_fee)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{formatPrice(order.shipping_fee)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
