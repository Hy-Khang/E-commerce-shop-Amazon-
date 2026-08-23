import { Package, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '@/common/utils/format.util';
import { usePagination } from '@/common/hooks/usePagination';
import { ROUTES } from '@/common/constants/routes';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { useSellerPopularWishlist } from '../hooks/useSellerPopularWishlist';
import type { PopularWishlistItem } from '../types/wishlist.types';

export default function SellerWishlistPopularPage() {
  const { params, setPage } = usePagination({ limit: 20 });
  const { data, isLoading } = useSellerPopularWishlist({ page: params.page, limit: params.limit });

  const columns: Column<PopularWishlistItem>[] = [
    {
      key: 'rank',
      header: 'Rank',
      render: (_, i) => (
        <span className="font-mono font-medium text-slate-500">
          #{data ? (data.meta.page - 1) * data.meta.limit + i + 1 : i + 1}
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (item) => (
        <Link to={ROUTES.PRODUCT_DETAIL(item.product_slug)} className="flex items-center gap-3 group">
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-slate-900/5">
            {item.product_thumbnail_url ? (
              <img src={getImageUrl(item.product_thumbnail_url)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100">
                <Package className="h-4 w-4 text-slate-400" />
              </div>
            )}
          </div>
          <span className="max-w-xs truncate font-medium text-slate-900 group-hover:text-amber-600 transition-colors">
            {item.product_name}
          </span>
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
          item.product_is_active ? 'text-emerald-700' : 'text-slate-500'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${item.product_is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {item.product_is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'count',
      header: 'Wishlist Count',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 font-semibold text-slate-900">
          <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
          {item.wishlist_count}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Popular Wishlisted Products</h1>
        <p className="mt-1 text-sm text-slate-500">Your products most frequently added to wishlists</p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyIcon={Heart}
        emptyTitle="No wishlisted products"
        emptyDescription="Your products will appear here once customers start adding them to wishlists."
      />
    </div>
  );
}
