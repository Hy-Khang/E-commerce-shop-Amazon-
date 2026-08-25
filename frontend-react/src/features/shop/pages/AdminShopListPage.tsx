import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Store, CheckCircle2, PauseCircle, Ban } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { useAdminShops } from '../hooks/useAdminShops';
import { useUpdateShopStatus } from '../hooks/useUpdateShopStatus';
import { ShopFilters } from '../components/ShopFilters';
import { ShopStatusBadge } from '../components/ShopStatusBadge';
import { SHOP_STATUS_LABELS } from '../types/shop.types';
import type {
  AdminShop,
  AdminShopQueryParams,
  ShopStatus,
} from '../types/shop.types';

function statusFromUrl(raw: string | null): ShopStatus | undefined {
  return raw && raw in SHOP_STATUS_LABELS ? (raw as ShopStatus) : undefined;
}

const STATUS_COPY: Record<'active' | 'suspended' | 'banned', {
  title: string;
  message: (name: string) => string;
  confirmLabel: string;
  variant: 'danger' | 'warning' | 'info';
}> = {
  active: {
    title: 'Activate shop?',
    message: (name) => `"${name}" will be visible on the storefront and can sell again.`,
    confirmLabel: 'Activate',
    variant: 'info',
  },
  suspended: {
    title: 'Suspend shop?',
    message: (name) => `"${name}"'s products will be hidden from the storefront until you reactivate it.`,
    confirmLabel: 'Suspend',
    variant: 'warning',
  },
  banned: {
    title: 'Ban shop?',
    message: (name) => `"${name}" will be banned and all its products hidden. You can reactivate it later.`,
    confirmLabel: 'Ban',
    variant: 'danger',
  },
};

export default function AdminShopListPage() {
  const { params, setPage } = usePagination({
    sort: 'created_at',
    order: 'desc',
  });

  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<
    Pick<AdminShopQueryParams, 'search' | 'status'>
  >(() => {
    // Seed the status filter from the URL so deep-links (e.g. the dashboard
    // "pending shops" signal) land pre-filtered.
    const status = statusFromUrl(searchParams.get('status'));
    return status ? { status } : {};
  });

  const queryParams: AdminShopQueryParams = { ...params, ...filters };

  const { data, isLoading } = useAdminShops(queryParams);
  const updateStatus = useUpdateShopStatus();
  const [statusTarget, setStatusTarget] = useState<{ shop: AdminShop; next: 'active' | 'suspended' | 'banned' } | null>(null);

  const handleFilterChange = useCallback(
    (newFilters: Partial<Pick<AdminShopQueryParams, 'search' | 'status'>>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      setPage(1);
    },
    [setPage],
  );

  const columns: Column<AdminShop>[] = [
    {
      key: 'shop',
      header: 'Shop',
      render: (shop) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="h-9 w-9 rounded-lg object-cover"
              />
            ) : (
              <Store className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-slate-900 truncate">{shop.name}</div>
            <div className="text-xs text-slate-400 truncate">/{shop.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (shop) => <ShopStatusBadge status={shop.status} />,
    },
    {
      key: 'owner',
      header: 'Owner ID',
      render: (shop) => (
        <span className="text-sm tabular-nums text-slate-500">#{shop.user_id}</span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (shop) => (
        <span className="text-slate-500">{formatDate(shop.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (shop) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to={ROUTES.ADMIN_SHOP_DETAIL(shop.id)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors inline-flex"
            aria-label="View shop details"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {shop.status !== 'active' && (
            <button
              onClick={() => setStatusTarget({ shop, next: 'active' })}
              className="inline-flex rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
              aria-label={shop.status === 'pending_verification' ? 'Approve shop' : 'Reactivate shop'}
              title={shop.status === 'pending_verification' ? 'Approve shop' : 'Reactivate shop'}
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
          {shop.status === 'active' && (
            <button
              onClick={() => setStatusTarget({ shop, next: 'suspended' })}
              className="inline-flex rounded-lg p-2 text-slate-400 transition-colors hover:bg-orange-50 hover:text-orange-600"
              aria-label="Suspend shop"
              title="Suspend shop"
            >
              <PauseCircle className="h-4 w-4" />
            </button>
          )}
          {shop.status !== 'banned' && (
            <button
              onClick={() => setStatusTarget({ shop, next: 'banned' })}
              className="inline-flex rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              aria-label="Ban shop"
              title="Ban shop"
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shops</h1>
        <p className="mt-1 text-sm text-slate-500">Manage seller shops and verification status</p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyIcon={Store}
        emptyTitle="No shops found"
        emptyDescription="Try adjusting your search or filter criteria."
        toolbar={
          <ShopFilters
            onFilterChange={handleFilterChange}
            initialStatus={filters.status ?? ''}
          />
        }
      />

      <ConfirmModal
        open={statusTarget !== null}
        variant={statusTarget ? STATUS_COPY[statusTarget.next].variant : 'warning'}
        title={statusTarget ? STATUS_COPY[statusTarget.next].title : ''}
        message={statusTarget ? STATUS_COPY[statusTarget.next].message(statusTarget.shop.name) : ''}
        confirmLabel={statusTarget ? STATUS_COPY[statusTarget.next].confirmLabel : 'Confirm'}
        loading={updateStatus.isPending}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => {
          if (!statusTarget) return;
          updateStatus.mutate(
            { id: statusTarget.shop.id, status: statusTarget.next },
            { onSuccess: () => setStatusTarget(null) },
          );
        }}
      />
    </div>
  );
}
