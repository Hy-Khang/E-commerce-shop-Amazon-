import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, Store } from 'lucide-react';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/common/constants/routes';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { Button } from '@/common/components/ui/Button';
import { PaymentTransactionList } from '@/features/payment';
import { useAdminOrder } from '../hooks/useAdminOrder';
import { useUpdateOrderStatus } from '../hooks/useUpdateOrderStatus';
import { useUpdatePaymentStatus } from '../hooks/useUpdatePaymentStatus';
import { useAdminOrderTracking } from '../hooks/useOrderTracking';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderItemRow } from '../components/OrderItemRow';
import { OrderTimeline } from '../components/OrderTimeline';
import { OrderTrackingMap } from '../components/OrderTrackingMap';
import { getValidNextStatuses, getPaymentStatusColor, canMarkAsPaid, groupItemsByShop } from '../utils/order.util';
import type { OrderStatus, PaymentStatus } from '../types/order.types';

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { data: order, isLoading, isError } = useAdminOrder(orderId);
  const { data: tracking } = useAdminOrderTracking(orderId);
  const updateStatus = useUpdateOrderStatus();
  const updatePayment = useUpdatePaymentStatus();
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    confirmLabel: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', variant: 'warning', confirmLabel: 'Confirm', onConfirm: () => {} });

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
        <p>Order not found.</p>
        <Link to={ROUTES.ADMIN_ORDERS} className="mt-4 text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300">
          Back to orders
        </Link>
      </div>
    );
  }

  const nextStatuses = getValidNextStatuses(order.status, order.payment_status, order.payment_method);
  const showMarkAsPaid = canMarkAsPaid(order.status, order.payment_status, order.payment_method);

  function handleStatusChange(status: OrderStatus) {
    const isCancelling = status === 'cancelled';
    setConfirmModal({
      open: true,
      title: isCancelling ? 'Cancel Order' : 'Update Order Status',
      message: isCancelling
        ? `Are you sure you want to cancel order #${order!.id}? This action cannot be undone.`
        : `Change order status to "${ORDER_STATUS_LABELS[status]}"?`,
      variant: isCancelling ? 'danger' : 'info',
      confirmLabel: isCancelling ? 'Cancel Order' : `Mark as ${ORDER_STATUS_LABELS[status]}`,
      onConfirm: () => {
        setConfirmModal((s) => ({ ...s, open: false }));
        updateStatus.mutate({ id: orderId, data: { status } });
      },
    });
  }

  function handlePaymentChange(payment_status: PaymentStatus) {
    setConfirmModal({
      open: true,
      title: 'Update Payment Status',
      message: `Mark this order as "${PAYMENT_STATUS_LABELS[payment_status]}"?`,
      variant: 'info',
      confirmLabel: `Mark as ${PAYMENT_STATUS_LABELS[payment_status]}`,
      onConfirm: () => {
        setConfirmModal((s) => ({ ...s, open: false }));
        updatePayment.mutate({ id: orderId, data: { payment_status } });
      },
    });
  }

  const paymentColors = getPaymentStatusColor(order.payment_status);
  const [payDotColor, payTextColor] = paymentColors.split(' ');

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.ADMIN_ORDERS}
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

      {order.status === 'return_requested' && (
        <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-500/25 dark:bg-orange-500/10">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
          <div>
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Customer requested a return/refund</p>
            <p className="mt-0.5 text-sm text-orange-700 dark:text-orange-400">
              Review and resolve: mark as Completed to reject, or Cancel to approve the return.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="admin-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Items ({order.order_items.length})
            </h2>
            {[...groupItemsByShop(order.order_items)].map(([shopId, group]) => (
              <div key={shopId ?? 'no-shop'}>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 pt-2 first:pt-0 dark:border-slate-800">
                  <Store className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {shopId ? (
                    <Link
                      to={ROUTES.ADMIN_SHOP_DETAIL(shopId)}
                      className="text-sm font-semibold text-slate-900 hover:text-teal-600 transition-colors dark:text-slate-100 dark:hover:text-teal-400"
                    >
                      {group.shopName}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{group.shopName}</span>
                  )}
                </div>
                {group.items.map((item) => (
                  <OrderItemRow
                    key={item.id}
                    item={item}
                    productLinkOverride={item.product_id ? ROUTES.ADMIN_PRODUCT_EDIT(item.product_id) : null}
                  />
                ))}
              </div>
            ))}
          </div>

          {order.user && (
            <div className="admin-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Customer</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">{order.user.full_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                  <dd className="text-slate-900 dark:text-slate-100">{order.user.email}</dd>
                </div>
                {order.user.phone && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500 dark:text-slate-400">Phone</dt>
                    <dd className="text-slate-900 dark:text-slate-100">{order.user.phone}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

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
                    variant={status === 'cancelled' ? 'danger' : 'secondary'}
                    onClick={() => handleStatusChange(status)}
                    loading={updateStatus.isPending}
                    className="w-full"
                  >
                    Mark as {ORDER_STATUS_LABELS[status]}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No further status transitions available.</p>
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
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Method</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {PAYMENT_METHOD_LABELS[order.payment_method]}
              </span>
            </div>

            {showMarkAsPaid && (
              <Button
                variant="primary"
                onClick={() => handlePaymentChange('paid')}
                loading={updatePayment.isPending}
                className="w-full"
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
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>{formatPrice(order.total_amount + order.discount_amount - order.shipping_fee)}</span>
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
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping</span>
                <span>{formatPrice(order.shipping_fee)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {order.payment_method !== 'cod' && (
            <PaymentTransactionList orderId={orderId} variant="admin" />
          )}
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
