import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { useWishlistStore } from '../stores/wishlist.store';
import { useWishlistCount } from '../hooks/useWishlistCount';

export function WishlistBadge() {
  useWishlistCount();
  const itemCount = useWishlistStore((s) => s.itemCount);

  return (
    <Link
      to={ROUTES.WISHLIST}
      className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
    >
      <Heart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
