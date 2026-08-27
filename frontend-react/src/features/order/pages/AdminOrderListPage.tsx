import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, ShoppingCart, Ban } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/common/constants/routes';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { AdminSortSelect, type SortOption } from '@/common/components/data/AdminSortSelect';
import { AdminSelect } from '@/common/components/data/AdminSelect';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { useUpdateOrderStatus } from '../hooks/useUpdateOrderStatus';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { getPaymentStatusColor } from '../utils/order.util';
import type { AdminOrderListParams, OrderStatus, PaymentStatus, OrderListItem } from '../types/order.types';

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'shipping', 'delivered', 'completed', 'return_requested', 'cancelled'];
const PAYMENT_OPTIONS: PaymentStatus[] = ['unpaid', 'paid'];
const CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipping'];

const ORDER_SORT_OPTIONS: SortOption[] = [
  { label: 'Newest', sort: 'created_at', order: 'desc' },
  { label: 'Oldest', sort: 'created_at', order: 'asc' },
  { label: 'Total: high → low', sort: 'total_amount', order: 'desc' },
  { label: 'Total: low → high', sort: 'total_amount', order: 'asc' },
];

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
  const updateStatus = useUpdateOrderStatus();
  const [cancelTarget, setCancelTarget] = useState<OrderListItem | null>(null);

  function handleFilterChange(key: string, value: string) {
    setSearchParams((prev) => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  }

  const columns: Column<OrderListItem>[] = [
    {
      key: 'order',
      header: 'Order',
      render: (order) => <span className="font-mono font-medium text-slate-900 dark:text-slate-100">#{order.id}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (order) => {
        const colors = getPaymentStatusColor(order.payment_status);
        const [dotColor, textColor] = colors.split(' ');
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
            {PAYMENT_STATUS_LABELS[order.payment_status]}
          </span>
        );
      },
    },
    {
      key: 'total',
      header: 'Total',
      render: (order) => <span className="font-medium text-slate-900 dark:text-slate-100">{formatPrice(order.total_amount)}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (order) => <span className="text-slate-500 dark:text-slate-400">{formatDate(order.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (order) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to={ROUTES.ADMIN_ORDER_DETAIL(order.id)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors inline-flex dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="View order"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {CANCELLABLE_STATUSES.includes(order.status) && (
            <button
              onClick={() => setCancelTarget(order)}
              className="inline-flex rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              aria-label="Cancel order"
              title="Cancel order"
            >
              <Ban className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Orders</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track and manage customer orders</p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyIcon={ShoppingCart}
        emptyTitle="No orders found"
        emptyDescription="Orders will appear here once customers start placing them."
        toolbar={
          <div className="admin-card p-4">
            <div className="flex flex-wrap gap-3">
              <AdminSelect
                ariaLabel="Filter by status"
                className="w-44"
                value={searchParams.get('status') || ''}
                onChange={(v) => handleFilterChange('status', v)}
                options={[
                  { value: '', label: 'All Statuses' },
                  ...STATUS_OPTIONS.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] })),
                ]}
              />

              <AdminSelect
                ariaLabel="Filter by payment status"
                className="w-44"
                value={searchParams.get('payment_status') || ''}
                onChange={(v) => handleFilterChange('payment_status', v)}
                options={[
                  { value: '', label: 'All Payments' },
                  ...PAYMENT_OPTIONS.map((s) => ({ value: s, label: PAYMENT_STATUS_LABELS[s] })),
                ]}
              />

              <AdminSortSelect options={ORDER_SORT_OPTIONS} bare />
            </div>
          </div>
        }
      />

      <ConfirmModal
        open={cancelTarget !== null}
        variant="danger"
        title="Cancel order?"
        message={
          cancelTarget
            ? `Order #${cancelTarget.id} will be cancelled. Stock and any applied coupons are restored automatically. This cannot be undone.`
            : ''
        }
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={updateStatus.isPending}
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => {
          if (!cancelTarget) return;
          updateStatus.mutate(
            { id: cancelTarget.id, data: { status: 'cancelled' } },
            { onSuccess: () => setCancelTarget(null) },
          );
        }}
      />
    </div>
  );
}
