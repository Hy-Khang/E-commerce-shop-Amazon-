import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Truck, PackageCheck } from 'lucide-react';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/common/constants/routes';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { Button } from '@/common/components/ui/Button';
import { useShipperOrder } from '../hooks/useShipperOrders';
import { useAcceptOrder, useMarkDelivered } from '../hooks/useShipperOrderActions';
import { useShipperOrderTracking } from '../hooks/useOrderTracking';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderItemRow } from '../components/OrderItemRow';
import { OrderTimeline } from '../components/OrderTimeline';
import { ShipperLocationUpdater } from '../components/ShipperLocationUpdater';
import { getPaymentStatusColor } from '../utils/order.util';

export default function ShipperDeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { data: order, isLoading, isError } = useShipperOrder(orderId);
  const { data: tracking } = useShipperOrderTracking(orderId, order?.status);
  const acceptOrder = useAcceptOrder();
  const markDelivered = useMarkDelivered();
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
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <p>Order not found or not accessible.</p>
        <Link to={ROUTES.SHIPPER_DELIVERIES} className="mt-4 text-sm text-emerald-600 hover:text-emerald-700">
          Back to deliveries
        </Link>
      </div>
    );
  }

  const isAvailable = order.status === 'confirmed' && !order.user_id;
  const isMyShipping = order.status === 'shipping';

  const paymentColors = getPaymentStatusColor(order.payment_status);
  const [payDotColor, payTextColor] = paymentColors.split(' ');

  function handleAccept() {
    setConfirmModal({
      open: true,
      title: 'Accept Order',
      message: `Accept order #${orderId} for delivery?`,
      variant: 'info',
      confirmLabel: 'Accept Order',
      onConfirm: () => {
        setConfirmModal((s) => ({ ...s, open: false }));
        acceptOrder.mutate(orderId);
      },
    });
  }

  function handleDeliver() {
    setConfirmModal({
      open: true,
      title: 'Mark as Delivered',
      message: `Confirm that order #${orderId} has been delivered?`,
      variant: 'info',
      confirmLabel: 'Mark Delivered',
      onConfirm: () => {
        setConfirmModal((s) => ({ ...s, open: false }));
        markDelivered.mutate(orderId);
      },
    });
  }

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.SHIPPER_DELIVERIES}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to deliveries
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Order #{order.id}</h1>
          <p className="mt-1 text-sm text-slate-500">{formatDate(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="admin-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Order Items ({order.order_items.length})
            </h2>
            {order.order_items.map((item) => (
              <OrderItemRow key={item.id} item={item} />
            ))}
          </div>

          {order.user && (
            <div className="admin-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Customer</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Name</dt>
                  <dd className="font-medium text-slate-900">{order.user.full_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="text-slate-900">{order.user.email}</dd>
                </div>
                {order.user.phone && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="text-slate-900">{order.user.phone}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {tracking && tracking.timeline.length > 0 && (
            <div className="admin-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Timeline</h2>
              <OrderTimeline timeline={tracking.timeline} />
            </div>
          )}

          {isMyShipping && (
            <div className="admin-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Update Location</h2>
              <ShipperLocationUpdater
                orderId={orderId}
                currentLocation={tracking?.shipperLocation}
                deliveryLocation={tracking?.deliveryLocation}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {(isAvailable || isMyShipping) && (
            <div className="admin-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Actions</h2>
              {isAvailable && (
                <Button
                  onClick={handleAccept}
                  loading={acceptOrder.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Accept Order
                </Button>
              )}
              {isMyShipping && (
                <Button
                  onClick={handleDeliver}
                  loading={markDelivered.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PackageCheck className="mr-2 h-4 w-4" />
                  Mark as Delivered
                </Button>
              )}
            </div>
          )}

          <div className="admin-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${payTextColor}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${payDotColor}`} />
                  {PAYMENT_STATUS_LABELS[order.payment_status]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Method</span>
                <span className="font-medium text-slate-900">
                  {PAYMENT_METHOD_LABELS[order.payment_method]}
                </span>
              </div>
            </div>
          </div>

          <div className="admin-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Shipping Address</h2>
            <div className="text-sm text-slate-700">
              <p className="font-medium text-slate-900">{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.phone}</p>
              <p>{order.shipping_address.address_line}</p>
              <p>{order.shipping_address.city}</p>
            </div>
          </div>

          <div className="admin-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee</span>
                <span>{formatPrice(order.shipping_fee)}</span>
              </div>
              {order.coupon_code && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon ({order.coupon_code})</span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
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
