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
    <div className="rounded-lg border bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Items ({itemCount})</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Shipping</span>
          <span className="text-gray-400">Calculated at checkout</span>
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="flex justify-between text-base font-semibold text-gray-900">
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
        className="mt-2 w-full rounded-md border px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Continue Shopping
      </button>
    </div>
  );
}
