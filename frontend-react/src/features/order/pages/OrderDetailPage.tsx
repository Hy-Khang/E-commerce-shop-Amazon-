import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Star } from 'lucide-react';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { Button } from '@/common/components/ui/Button';
import { ROUTES, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/common/constants/routes';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted/60" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
        <p>Order not found.</p>
        <Link to={ROUTES.ORDERS} className="mt-4 text-sm font-semibold text-text-brand hover:text-primary-700 transition-colors">
          Back to orders
        </Link>
      </div>
    );
  }

  function handleCancel() {
    setShowCancelConfirm(true);
  }

  const isDelivered = order.status === 'delivered';

  return (
    <div>
      <Link
        to={ROUTES.ORDERS}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-brand hover:text-primary-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Order #{order.id}</h1>
          <p className="mt-1 text-sm text-text-muted">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {isOrderCancellable(order.status) && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancel}
              disabled={cancelOrder.isPending}
            >
              {cancelOrder.isPending ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <div className="shop-card p-6">
            <h2 className="mb-4 text-lg font-bold tracking-tight text-text-primary">
              Items ({order.order_items.length})
            </h2>
            {order.order_items.map((item) => (
              <div key={item.id}>
                <OrderItemRow item={item} />
                {isDelivered && item.product_id && (
                  <div className="pb-4 pl-20">
                    {reviewingItemId === item.id ? (
                      <div className="rounded-xl border border-border-default bg-neutral-50/50 p-5">
                        <div className="mb-3.5 flex items-center justify-between">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">Write a Review</h3>
                          <button
                            onClick={() => setReviewingItemId(null)}
                            className="text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
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
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-brand hover:text-primary-700 transition-colors"
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
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
          <div className="shop-card p-6">
            <h2 className="mb-4 text-lg font-bold tracking-tight text-text-primary">Order Info</h2>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Payment</dt>
                <dd className="font-semibold text-text-primary">
                  {PAYMENT_METHOD_LABELS[order.payment_method]}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Payment Status</dt>
                <dd>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                    {PAYMENT_STATUS_LABELS[order.payment_status]}
                  </span>
                </dd>
              </div>
              <div className="border-t border-border-default pt-3">
                <dt className="mb-1 text-text-secondary">Shipping Address</dt>
                <dd className="text-text-secondary">
                  <p className="font-semibold text-text-primary">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.phone}</p>
                  <p>{order.shipping_address.address_line}</p>
                  <p>{order.shipping_address.city}</p>
                </dd>
              </div>
            </dl>
          </div>

          {/* Order Summary */}
          <div className="shop-card p-6">
            <h2 className="mb-4 text-lg font-bold tracking-tight text-text-primary">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>{formatPrice(order.total_amount + order.discount_amount - order.shipping_fee)}</span>
              </div>
              {order.coupon_code && (
                <div className="flex justify-between font-medium text-success-600">
                  <span>Coupon ({order.coupon_code})</span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span>{formatPrice(order.shipping_fee)}</span>
              </div>
              <div className="flex justify-between border-t border-border-default pt-2 text-base font-bold text-text-primary">
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showCancelConfirm}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        variant="danger"
        confirmLabel="Cancel Order"
        loading={cancelOrder.isPending}
        onConfirm={() => {
          setShowCancelConfirm(false);
          cancelOrder.mutate(orderId);
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
