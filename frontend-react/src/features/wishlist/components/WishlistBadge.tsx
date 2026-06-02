import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { useWishlistStore } from '../stores/wishlist.store';
import { useWishlistCount } from '../hooks/useWishlistCount';

export function WishlistBadge() {
  useWishlistCount();
  const itemCount = useWishlistStore((s) => s.itemCount);

  return (
    <Link to={ROUTES.WISHLIST} className="relative text-gray-600 hover:text-gray-900">
      <Heart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
