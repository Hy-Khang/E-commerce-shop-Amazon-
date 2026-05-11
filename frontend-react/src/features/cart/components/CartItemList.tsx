import type { CartItem } from '../types/cart.types';
import { CartItemRow } from './CartItemRow';

interface Props {
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
  isUpdating: boolean;
}

export function CartItemList({ items, onUpdateQuantity, onRemove, isUpdating }: Props) {
  return (
    <div className="rounded-lg border bg-white">
      <div className="hidden border-b px-4 py-3 sm:grid sm:grid-cols-[1fr_auto_7rem_2rem] sm:gap-4">
        <span className="text-xs font-medium uppercase text-gray-500">Product</span>
        <span className="text-xs font-medium uppercase text-gray-500">Quantity</span>
        <span className="text-right text-xs font-medium uppercase text-gray-500">Total</span>
        <span />
      </div>
      <div className="px-4">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            isUpdating={isUpdating}
          />
        ))}
      </div>
    </div>
  );
}
