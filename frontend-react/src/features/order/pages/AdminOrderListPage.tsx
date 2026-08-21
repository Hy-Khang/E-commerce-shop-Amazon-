import { Link, useSearchParams } from 'react-router-dom';
import { Eye, ShoppingCart } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/common/constants/routes';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { getPaymentStatusColor } from '../utils/order.util';
import type { AdminOrderListParams, OrderStatus, PaymentStatus, OrderListItem } from '../types/order.types';

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'shipping', 'delivered', 'completed', 'return_requested', 'cancelled'];
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

  const columns: Column<OrderListItem>[] = [
    {
      key: 'order',
      header: 'Order',
      render: (order) => <span className="font-mono font-medium text-slate-900">#{order.id}</span>,
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
      render: (order) => <span className="font-medium text-slate-900">{formatPrice(order.total_amount)}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (order) => <span className="text-slate-500">{formatDate(order.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (order) => (
        <Link
          to={ROUTES.ADMIN_ORDER_DETAIL(order.id)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors inline-flex"
          aria-label="View order"
        >
          <Eye className="h-4 w-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">Track and manage customer orders</p>
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
              <select
                value={searchParams.get('status') || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="admin-input w-auto"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                ))}
              </select>

              <select
                value={searchParams.get('payment_status') || ''}
                onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                className="admin-input w-auto"
              >
                <option value="">All Payments</option>
                {PAYMENT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
        }
      />
    </div>
  );
}
