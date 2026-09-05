import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import { ROUTES } from '@/common/constants/routes';
import { useTrackActivityCallback } from '@/features/recommendations';
import { useCheckWishlist } from '../hooks/useCheckWishlist';
import { useAddToWishlist } from '../hooks/useAddToWishlist';
import { useRemoveFromWishlist } from '../hooks/useRemoveFromWishlist';

interface Props {
  productId: number;
  isInWishlist?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function WishlistButton({ productId, isInWishlist, size = 'md', className }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const { data: checked } = useCheckWishlist(productId);
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const track = useTrackActivityCallback();

  const wishlisted = isInWishlist ?? checked ?? false;
  const isPending = addToWishlist.isPending || removeFromWishlist.isPending;

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (isPending) return;

    if (wishlisted) {
      removeFromWishlist.mutate(productId);
    } else {
      addToWishlist.mutate({ product_id: productId });
      track({ action: 'ADD_TO_WISHLIST', target_type: 'product', target_id: productId });
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={
        className ??
        `rounded-full p-2 transition-colors ${
          wishlisted
            ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/15'
            : 'text-text-muted hover:bg-surface-hover hover:text-rose-500'
        } disabled:opacity-50`
      }
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={`${iconSize} ${wishlisted ? 'fill-current' : ''}`}
      />
    </button>
  );
}
