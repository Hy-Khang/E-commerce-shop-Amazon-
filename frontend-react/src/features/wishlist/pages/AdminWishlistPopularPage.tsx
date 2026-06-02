import { Package, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePagination } from '@/common/hooks/usePagination';
import { ROUTES } from '@/common/constants/routes';
import { useAdminPopularWishlist } from '../hooks/useAdminPopularWishlist';
import type { PopularWishlistItem } from '../types/wishlist.types';

export default function AdminWishlistPopularPage() {
  const { params, setPage } = usePagination({ limit: 20 });
  const { data, isLoading } = useAdminPopularWishlist({ page: params.page, limit: params.limit });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Popular Wishlisted Products</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Wishlist Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.data.length > 0 ? (
              data.data.map((item, index) => (
                <PopularRow
                  key={item.product_id}
                  item={item}
                  rank={(data.meta.page - 1) * data.meta.limit + index + 1}
                />
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No wishlisted products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(data.meta.page - 1)}
            disabled={data.meta.page <= 1}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <button
            onClick={() => setPage(data.meta.page + 1)}
            disabled={data.meta.page >= data.meta.totalPages}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

interface PopularRowProps {
  item: PopularWishlistItem;
  rank: number;
}

function PopularRow({ item, rank }: PopularRowProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-medium text-gray-500">#{rank}</td>
      <td className="px-4 py-3">
        <Link to={ROUTES.PRODUCT_DETAIL(item.product_slug)} className="flex items-center gap-3 hover:text-blue-600">
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded border bg-gray-100">
            {item.product_thumbnail_url ? (
              <img src={item.product_thumbnail_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
          <span className="max-w-xs truncate text-sm font-medium text-gray-900">
            {item.product_name}
          </span>
        </Link>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            item.product_is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {item.product_is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-900">
          <Heart className="h-3.5 w-3.5 fill-red-400 text-red-400" />
          {item.wishlist_count}
        </div>
      </td>
    </tr>
  );
}
