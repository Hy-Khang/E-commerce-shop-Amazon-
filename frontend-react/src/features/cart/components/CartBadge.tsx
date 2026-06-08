import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { useCartStore } from '../stores/cart.store';
import { useCart } from '../hooks/useCart';

export function CartBadge() {
  useCart();
  const itemCount = useCartStore((s) => s.itemCount);

  return (
    <Link
      to={ROUTES.CART}
      className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
