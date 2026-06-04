import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/common/constants/routes';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { useAdminOrder } from '../hooks/useAdminOrder';
import { useUpdateOrderStatus } from '../hooks/useUpdateOrderStatus';
import { useUpdatePaymentStatus } from '../hooks/useUpdatePaymentStatus';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderItemRow } from '../components/OrderItemRow';
import { getValidNextStatuses, getPaymentStatusColor, canMarkAsPaid } from '../utils/order.util';
import type { OrderStatus, PaymentStatus } from '../types/order.types';

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { data: order, isLoading, isError } = useAdminOrder(orderId);
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p>Order not found.</p>
        <Link to={ROUTES.ADMIN_ORDERS} className="mt-4 text-sm text-blue-600 hover:text-blue-800">
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
        ? `Are you sure you want to cancel order #${order.id}? This action cannot be undone.`
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

  return (
    <div>
      <Link
        to={ROUTES.ADMIN_ORDERS}
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
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Items ({order.order_items.length})
            </h2>
            {order.order_items.map((item) => (
              <OrderItemRow key={item.id} item={item} />
            ))}
          </div>

          {/* Customer Info */}
          {order.user && (
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Customer</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Name</dt>
                  <dd className="font-medium text-gray-900">{order.user.full_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="text-gray-900">{order.user.email}</dd>
                </div>
                {order.user.phone && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="text-gray-900">{order.user.phone}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Status Controls */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Update Status</h2>

            {nextStatuses.length > 0 ? (
              <div className="space-y-2">
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={updateStatus.isPending}
                    className="w-full rounded-md border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {updateStatus.isPending ? 'Updating...' : `Mark as ${ORDER_STATUS_LABELS[status]}`}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No further status transitions available.</p>
            )}
          </div>

          {/* Payment Controls */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment</h2>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                {PAYMENT_STATUS_LABELS[order.payment_status]}
              </span>
            </div>
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">Method</span>
              <span className="font-medium text-gray-900">
                {PAYMENT_METHOD_LABELS[order.payment_method]}
              </span>
            </div>

            {showMarkAsPaid && (
              <button
                onClick={() => handlePaymentChange('paid')}
                disabled={updatePayment.isPending}
                className="w-full rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {updatePayment.isPending ? 'Updating...' : 'Mark as Paid'}
              </button>
            )}
          </div>

          {/* Shipping Address */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Shipping Address</h2>
            <div className="text-sm text-gray-900">
              <p className="font-medium">{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.phone}</p>
              <p>{order.shipping_address.address_line}</p>
              <p>{order.shipping_address.city}</p>
            </div>
          </div>

          {/* Order Total */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.total_amount + order.discount_amount - order.shipping_fee)}</span>
              </div>
              {order.coupon_code && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({order.coupon_code})</span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
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
