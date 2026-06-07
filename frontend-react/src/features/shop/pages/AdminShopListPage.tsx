import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Store } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { useAdminShops } from '../hooks/useAdminShops';
import { ShopFilters } from '../components/ShopFilters';
import { ShopStatusBadge } from '../components/ShopStatusBadge';
import type { AdminShop, AdminShopQueryParams, ShopStatus } from '../types/shop.types';

export default function AdminShopListPage() {
  const { params, setPage } = usePagination({
    sort: 'created_at',
    order: 'desc',
  });

  const [filters, setFilters] = useState<Pick<AdminShopQueryParams, 'search' | 'status'>>({});

  const queryParams: AdminShopQueryParams = { ...params, ...filters };

  const { data, isLoading } = useAdminShops(queryParams);

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
        <div className="flex items-center justify-end">
          <Link
            to={ROUTES.ADMIN_SHOP_DETAIL(shop.id)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="View shop details"
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
        toolbar={<ShopFilters onFilterChange={handleFilterChange} />}
      />
    </div>
  );
}
