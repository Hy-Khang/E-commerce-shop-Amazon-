import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Truck, PackageCheck, Package } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/common/constants/routes';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { AdminSelect } from '@/common/components/data/AdminSelect';
import { Button } from '@/common/components/ui/Button';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { useShipperOrders } from '../hooks/useShipperOrders';
import { useAcceptOrder, useMarkDelivered } from '../hooks/useShipperOrderActions';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { getPaymentStatusColor } from '../utils/order.util';
import type { ShipperOrderListParams, OrderStatus, OrderListItem } from '../types/order.types';

type TabFilter = 'available' | 'my_deliveries';

const TABS: { key: TabFilter; label: string; icon: typeof Package }[] = [
  { key: 'available', label: 'Available Orders', icon: Package },
  { key: 'my_deliveries', label: 'My Deliveries', icon: Truck },
];

const MY_STATUS_OPTIONS: OrderStatus[] = ['shipping', 'delivered', 'completed'];

export default function ShipperDeliveryListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const activeTab = (searchParams.get('filter') as TabFilter) || 'available';
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

  const filters: ShipperOrderListParams = {
    ...params,
    filter: activeTab,
    status: activeTab === 'my_deliveries'
      ? (searchParams.get('status') as OrderStatus) || undefined
      : undefined,
  };

  const { data, isLoading } = useShipperOrders(filters);

  function handleTabChange(tab: TabFilter) {
    setSearchParams((prev) => {
      prev.set('filter', tab);
      prev.delete('status');
      prev.set('page', '1');
      return prev;
    });
  }

  function handleStatusFilter(value: string) {
    setSearchParams((prev) => {
      if (value) prev.set('status', value);
      else prev.delete('status');
      prev.set('page', '1');
      return prev;
    });
  }

  function handleAccept(order: OrderListItem) {
    setConfirmModal({
      open: true,
      title: 'Accept Order',
      message: `Accept order #${order.id} for delivery? You will be responsible for delivering this order.`,
      variant: 'info',
      confirmLabel: 'Accept Order',
      onConfirm: () => {
        setConfirmModal((s) => ({ ...s, open: false }));
        acceptOrder.mutate(order.id);
      },
    });
  }

  function handleDeliver(order: OrderListItem) {
    setConfirmModal({
      open: true,
      title: 'Mark as Delivered',
      message: `Confirm that order #${order.id} has been delivered to the customer?`,
      variant: 'info',
      confirmLabel: 'Mark Delivered',
      onConfirm: () => {
        setConfirmModal((s) => ({ ...s, open: false }));
        markDelivered.mutate(order.id);
      },
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
        <div className="flex items-center justify-end gap-2">
          {activeTab === 'available' && order.status === 'confirmed' && (
            <Button
              size="sm"
              onClick={() => handleAccept(order)}
              loading={acceptOrder.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Accept
            </Button>
          )}
          {activeTab === 'my_deliveries' && order.status === 'shipping' && (
            <Button
              size="sm"
              onClick={() => handleDeliver(order)}
              loading={markDelivered.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PackageCheck className="mr-1 h-3.5 w-3.5" />
              Delivered
            </Button>
          )}
          <Link
            to={`${ROUTES.SHIPPER_DELIVERIES}/${order.id}`}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors inline-flex dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="View order"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Deliveries</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your delivery orders</p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyIcon={activeTab === 'available' ? Package : Truck}
        emptyTitle={activeTab === 'available' ? 'No available orders' : 'No deliveries yet'}
        emptyDescription={
          activeTab === 'available'
            ? 'There are no confirmed orders waiting for pickup.'
            : 'Orders you accept will appear here.'
        }
        toolbar={
          <div className="space-y-3">
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'my_deliveries' && (
              <div className="admin-card p-4">
                <AdminSelect
                  ariaLabel="Filter by status"
                  className="w-44"
                  value={searchParams.get('status') || ''}
                  onChange={(v) => handleStatusFilter(v)}
                  options={[
                    { value: '', label: 'All Statuses' },
                    ...MY_STATUS_OPTIONS.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] })),
                  ]}
                />
              </div>
            )}
          </div>
        }
      />

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
