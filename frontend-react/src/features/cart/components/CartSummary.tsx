import { useNavigate } from 'react-router-dom';
import { formatPrice } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import type { CartItem } from '../types/cart.types';
import { calculateSubtotal } from '../utils/cart.util';

interface Props {
  items: CartItem[];
}

export function CartSummary({ items }: Props) {
  const navigate = useNavigate();
  const subtotal = calculateSubtotal(items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="rounded-xl border border-border-default bg-white p-6">
      <h2 className="text-lg font-bold tracking-tight text-text-primary">Order Summary</h2>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm text-text-secondary">
          <span>Items ({itemCount})</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-text-secondary">
          <span>Shipping</span>
          <span className="text-text-muted">Calculated at checkout</span>
        </div>
      </div>

      <div className="mt-4 border-t border-border-default pt-4">
        <div className="flex justify-between text-base font-bold text-text-primary">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </div>

      <button
        onClick={() => navigate(ROUTES.CHECKOUT)}
        disabled={items.length === 0}
        className="mt-6 w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        Proceed to Checkout
      </button>

      <button
        onClick={() => navigate(ROUTES.PRODUCTS)}
        className="mt-2 w-full rounded-lg border border-border-default px-4 py-3 text-sm font-medium text-text-secondary hover:bg-neutral-50"
      >
        Continue Shopping
      </button>
    </div>
  );
}
