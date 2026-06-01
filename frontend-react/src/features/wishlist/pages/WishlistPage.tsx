import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePagination } from '@/common/hooks/usePagination';
import { ROUTES } from '@/common/constants/routes';
import { useWishlist } from '../hooks/useWishlist';
import { useRemoveFromWishlist } from '../hooks/useRemoveFromWishlist';
import { WishlistItemCard } from '../components/WishlistItemCard';

export default function WishlistPage() {
  const { params, setPage } = usePagination({ limit: 12, sort: 'created_at', order: 'desc' });
  const { data, isLoading } = useWishlist(params);
  const removeFromWishlist = useRemoveFromWishlist();

  function handleRemove(productId: number) {
    removeFromWishlist.mutate(productId);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Wishlist</h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-white p-4">
              <div className="flex gap-4">
                <div className="h-20 w-20 animate-pulse rounded-md bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Heart className="h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">Your wishlist is empty</h2>
          <p className="mt-1 text-sm text-gray-500">
            Save products you love and come back to them later.
          </p>
          <Link
            to={ROUTES.PRODUCTS}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            {data.meta.total} item{data.meta.total !== 1 ? 's' : ''} in your wishlist
          </p>

          <div className="space-y-3">
            {data.data.map((item) => (
              <WishlistItemCard
                key={item.product_id}
                item={item}
                onRemove={handleRemove}
                isRemoving={removeFromWishlist.isPending}
              />
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
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
        </>
      )}
    </div>
  );
}
