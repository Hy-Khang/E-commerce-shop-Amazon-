import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePagination } from '@/common/hooks/usePagination';
import { ROUTES } from '@/common/constants/routes';
import { Pagination } from '@/common/components/data/Pagination';
import { useWishlist } from '../hooks/useWishlist';
import { useRemoveFromWishlist } from '../hooks/useRemoveFromWishlist';
import { WishlistItemCard } from '../components/WishlistItemCard';
import { Button } from '@/common/components/ui/Button';

export default function WishlistPage() {
  const { params, setPage } = usePagination({ limit: 12, sort: 'created_at', order: 'desc' });
  const { data, isLoading } = useWishlist(params);
  const removeFromWishlist = useRemoveFromWishlist();

  function handleRemove(productId: number) {
    removeFromWishlist.mutate(productId);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 rounded bg-slate-100 animate-pulse" />
        <div className="space-y-4">
          <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">My Wishlist</h1>
        <p className="mt-1 text-sm text-text-secondary">Keep track of the products you love and want to watch.</p>
      </div>

      {!data || data.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="h-14 w-14 text-text-muted" />
          <h2 className="mt-4 text-base font-semibold text-text-primary">Your wishlist is empty</h2>
          <p className="mt-1 text-sm text-text-secondary max-w-xs">
            Explore our shop and save products you love to view them later.
          </p>
          <Link to={ROUTES.PRODUCTS} className="mt-5">
            <Button variant="brand">Browse Products</Button>
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {data.meta.total} item{data.meta.total !== 1 ? 's' : ''} saved
          </p>

          <div className="grid grid-cols-1 gap-4">
            {data.data.map((item) => (
              <WishlistItemCard
                key={item.product_id}
                item={item}
                onRemove={handleRemove}
                isRemoving={removeFromWishlist.isPending}
              />
            ))}
          </div>

          <div className="pt-4 border-t border-border-default">
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}

