import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Package, Eye, EyeOff } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate, getImageUrl } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { ProductFilters } from '../components/ProductFilters';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { useToggleProductActive } from '../hooks/useToggleProductActive';
import { getPriceRange } from '../utils/product.util';
import type { AdminProductListParams, ProductListItem } from '../types/product.types';

export default function AdminProductListPage() {
  const [searchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const filters: AdminProductListParams = {
    ...params,
    search: searchParams.get('search') || undefined,
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
    is_active: searchParams.get('is_active') !== null ? searchParams.get('is_active') === 'true' : undefined,
  };

  const { data, isLoading } = useAdminProducts(filters);
  const toggleActive = useToggleProductActive();
  const [toggleTarget, setToggleTarget] = useState<ProductListItem | null>(null);

  const columns: Column<ProductListItem>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (product) => (
        <div className="flex items-center gap-3">
          {product.thumbnail_url ? (
            <img src={getImageUrl(product.thumbnail_url)} alt="" className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-900/5" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-slate-900/5">
              <Package className="h-4 w-4 text-slate-400" />
            </div>
          )}
          <span className="font-medium text-slate-900">{product.name}</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price Range',
      render: (product) => {
        const range = getPriceRange(product.variants);
        return range ? (
          <span className="text-slate-600">{formatPrice(range.min)} — {formatPrice(range.max)}</span>
        ) : (
          <span className="text-slate-400">—</span>
        );
      },
    },
    {
      key: 'variants',
      header: 'Variants',
      render: (product) => <span className="text-slate-600">{product.variants.length}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (product) => (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            product.is_active ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {product.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (product) => <span className="text-slate-500">{formatDate(product.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (product) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to={ROUTES.ADMIN_PRODUCT_EDIT(product.id)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors inline-flex"
            aria-label="Edit product"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setToggleTarget(product)}
            className={`inline-flex rounded-lg p-2 text-slate-400 transition-colors ${
              product.is_active
                ? 'hover:bg-rose-50 hover:text-rose-600'
                : 'hover:bg-emerald-50 hover:text-emerald-600'
            }`}
            aria-label={product.is_active ? 'Hide product' : 'Show product'}
            title={product.is_active ? 'Hide product' : 'Show product'}
          >
            {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your product catalog</p>
        </div>
        <Link
          to={ROUTES.ADMIN_PRODUCT_CREATE}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyIcon={Package}
        emptyTitle="No products found"
        emptyDescription="Add a product to get started or adjust your search."
        toolbar={<ProductFilters />}
      />

      <ConfirmModal
        open={toggleTarget !== null}
        variant="warning"
        title={toggleTarget?.is_active ? 'Hide product?' : 'Show product?'}
        message={
          toggleTarget?.is_active
            ? `"${toggleTarget?.name}" will be hidden from the storefront until you show it again.`
            : `"${toggleTarget?.name}" will be visible on the storefront again.`
        }
        confirmLabel={toggleTarget?.is_active ? 'Hide' : 'Show'}
        confirmVariant={toggleTarget?.is_active ? 'danger' : 'primary'}
        loading={toggleActive.isPending}
        onCancel={() => setToggleTarget(null)}
        onConfirm={() => {
          if (!toggleTarget) return;
          toggleActive.mutate(toggleTarget.id, {
            onSuccess: () => setToggleTarget(null),
          });
        }}
      />
    </div>
  );
}
