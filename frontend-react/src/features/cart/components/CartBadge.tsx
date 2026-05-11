import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { useCartStore } from '../stores/cart.store';

export function CartBadge() {
  const itemCount = useCartStore((s) => s.itemCount);

  return (
    <Link to={ROUTES.CART} className="relative text-gray-600 hover:text-gray-900">
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
