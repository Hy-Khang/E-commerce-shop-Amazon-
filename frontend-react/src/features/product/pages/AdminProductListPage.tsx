import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Search, Plus, Package } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate, getImageUrl } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { Button } from '@/common/components/ui/Button';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { useToggleProductActive } from '../hooks/useToggleProductActive';
import { getPriceRange } from '../utils/product.util';
import type { AdminProductListParams, ProductListItem } from '../types/product.types';

export default function AdminProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const filters: AdminProductListParams = {
    ...params,
    search: searchParams.get('search') || undefined,
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
    is_active: searchParams.get('is_active') !== null ? searchParams.get('is_active') === 'true' : undefined,
  };

  const { data, isLoading } = useAdminProducts(filters);
  const toggleActive = useToggleProductActive();

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    setSearchParams((prev) => {
      if (search) prev.set('search', search);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    });
  }

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
        <button
          onClick={() => toggleActive.mutate(product.id)}
          disabled={toggleActive.isPending}
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            product.is_active ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {product.is_active ? 'Active' : 'Inactive'}
        </button>
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
        <Link
          to={ROUTES.ADMIN_PRODUCT_EDIT(product.id)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors inline-flex"
          aria-label="Edit product"
        >
          <Pencil className="h-4 w-4" />
        </Link>
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
        toolbar={
          <div className="admin-card p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="search"
                  type="text"
                  placeholder="Search products..."
                  defaultValue={searchParams.get('search') || ''}
                  className="admin-input pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
            </form>
          </div>
        }
      />
    </div>
  );
}
