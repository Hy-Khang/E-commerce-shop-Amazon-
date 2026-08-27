import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/common/constants/routes';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { Button } from '@/common/components/ui/Button';
import { useSellerOrder } from '../hooks/useSellerOrder';
import { useUpdateSellerOrderStatus } from '../hooks/useUpdateSellerOrderStatus';
import { useUpdateSellerPaymentStatus } from '../hooks/useUpdateSellerPaymentStatus';
import { useSellerOrderTracking } from '../hooks/useOrderTracking';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderItemRow } from '../components/OrderItemRow';
import { OrderTimeline } from '../components/OrderTimeline';
import { OrderTrackingMap } from '../components/OrderTrackingMap';
import { getSellerNextStatuses, getPaymentStatusColor, canMarkAsPaid } from '../utils/order.util';
import type { OrderStatus } from '../types/order.types';

export default function SellerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { data: order, isLoading, isError } = useSellerOrder(orderId);
  const { data: tracking } = useSellerOrderTracking(orderId);
  const updateStatus = useUpdateSellerOrderStatus();
  const updatePayment = useUpdateSellerPaymentStatus();
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    confirmLabel: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', variant: 'info', confirmLabel: 'Confirm', onConfirm: () => {} });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
        <p>Order not found or does not contain your products.</p>
        <Link to={ROUTES.SELLER_ORDERS} className="mt-4 text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300">
          Back to orders
        </Link>
      </div>
    );
  }

  const nextStatuses = getSellerNextStatuses(order.status);

  function handleStatusChange(status: OrderStatus) {
    setConfirmModal({
      open: true,
      title: 'Update Order Status',
      message: `Change order status to "${ORDER_STATUS_LABELS[status]}"?`,
      variant: 'info',
      confirmLabel: `Mark as ${ORDER_STATUS_LABELS[status]}`,
      onConfirm: () => {
        setConfirmModal((s) => ({ ...s, open: false }));
        updateStatus.mutate({ id: orderId, data: { status } });
      },
    });
  }

  const paymentColors = getPaymentStatusColor(order.payment_status);
  const [payDotColor, payTextColor] = paymentColors.split(' ');

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.SELLER_ORDERS}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Order #{order.id}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDate(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="admin-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Your Items ({order.seller_items_count})
            </h2>
            {order.order_items.map((item) => (
              <OrderItemRow key={item.id} item={item} />
            ))}
            <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
              <span>Your Items Total</span>
              <span>{formatPrice(order.seller_items_total)}</span>
            </div>
          </div>

          <div className="admin-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Customer</h2>
            <dl className="space-y-2 text-sm">
              {order.user_full_name && (
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">{order.user_full_name}</dd>
                </div>
              )}
              {order.user_email && (
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                  <dd className="text-slate-900 dark:text-slate-100">{order.user_email}</dd>
                </div>
              )}
            </dl>
          </div>

          {tracking && tracking.timeline.length > 0 && (
            <div className="admin-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Order Timeline</h2>
              <OrderTimeline timeline={tracking.timeline} />
            </div>
          )}

          {tracking?.shipperLocation && (
            <div className="admin-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {order.status === 'shipping' ? 'Live Tracking' : 'Last Known Shipper Location'}
              </h2>
              <OrderTrackingMap
                shipperLocation={tracking.shipperLocation}
                deliveryLocation={tracking.deliveryLocation}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="admin-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Update Status</h2>
            {nextStatuses.length > 0 ? (
              <div className="space-y-2">
                {nextStatuses.map((status) => (
                  <Button
                    key={status}
                    variant="secondary"
                    onClick={() => handleStatusChange(status)}
                    loading={updateStatus.isPending}
                    className="w-full"
                  >
                    Mark as {ORDER_STATUS_LABELS[status]}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No further status transitions available for sellers.</p>
            )}
          </div>

          <div className="admin-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Payment</h2>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Status</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${payTextColor}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${payDotColor}`} />
                {PAYMENT_STATUS_LABELS[order.payment_status]}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Method</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {PAYMENT_METHOD_LABELS[order.payment_method]}
              </span>
            </div>
            {canMarkAsPaid(order.status, order.payment_status, order.payment_method) && (
              <Button
                variant="secondary"
                className="mt-4 w-full"
                loading={updatePayment.isPending}
                onClick={() =>
                  setConfirmModal({
                    open: true,
                    title: 'Confirm Payment',
                    message: 'Mark this order as paid?',
                    variant: 'info',
                    confirmLabel: 'Mark as Paid',
                    onConfirm: () => {
                      setConfirmModal((s) => ({ ...s, open: false }));
                      updatePayment.mutate({ id: orderId, data: { payment_status: 'paid' } });
                    },
                  })
                }
              >
                Mark as Paid
              </Button>
            )}
          </div>

          <div className="admin-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Shipping Address</h2>
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <p className="font-medium text-slate-900 dark:text-slate-100">{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.phone}</p>
              <p>{order.shipping_address.address_line}</p>
              <p>{order.shipping_address.city}</p>
            </div>
          </div>

          <div className="admin-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Order Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
              {order.applied_coupons && order.applied_coupons.length > 0 ? (
                order.applied_coupons.map((c) => (
                  <div key={c.code} className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Coupon ({c.code})</span>
                    <span>-{formatPrice(c.discount_amount)}</span>
                  </div>
                ))
              ) : (
                order.coupon_code && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Coupon ({order.coupon_code})</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </div>
                )
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
                <span>Your Revenue</span>
                <span>{formatPrice(order.seller_items_total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
