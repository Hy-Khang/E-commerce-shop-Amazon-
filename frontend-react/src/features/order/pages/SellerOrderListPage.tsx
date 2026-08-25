import { Link, useSearchParams } from 'react-router-dom';
import { Eye, ShoppingCart } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/common/constants/routes';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { AdminSortSelect, type SortOption } from '@/common/components/data/AdminSortSelect';
import { AdminSelect } from '@/common/components/data/AdminSelect';
import { useSellerOrders } from '../hooks/useSellerOrders';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { getPaymentStatusColor } from '../utils/order.util';
import type { SellerOrderListParams, OrderStatus, PaymentStatus, OrderListItem } from '../types/order.types';

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'shipping', 'delivered', 'completed', 'return_requested', 'cancelled'];
const PAYMENT_OPTIONS: PaymentStatus[] = ['unpaid', 'paid'];

const ORDER_SORT_OPTIONS: SortOption[] = [
  { label: 'Newest', sort: 'created_at', order: 'desc' },
  { label: 'Oldest', sort: 'created_at', order: 'asc' },
  { label: 'Total: high → low', sort: 'total_amount', order: 'desc' },
  { label: 'Total: low → high', sort: 'total_amount', order: 'asc' },
];

export default function SellerOrderListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const filters: SellerOrderListParams = {
    ...params,
    status: (searchParams.get('status') as OrderStatus) || undefined,
    payment_status: (searchParams.get('payment_status') as PaymentStatus) || undefined,
  };

  const { data, isLoading } = useSellerOrders(filters);

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
          to={ROUTES.SELLER_ORDER_DETAIL(order.id)}
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
        <p className="mt-1 text-sm text-slate-500">Orders containing your products</p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyIcon={ShoppingCart}
        emptyTitle="No orders yet"
        emptyDescription="Orders containing your products will appear here."
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
    </div>
  );
}
