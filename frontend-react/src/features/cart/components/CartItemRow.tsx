import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import type { CartItem } from '../types/cart.types';
import { getEffectivePrice, getItemTotal } from '../utils/cart.util';

interface Props {
  item: CartItem;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
  isUpdating: boolean;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove, isUpdating }: Props) {
  const effectivePrice = getEffectivePrice(item);
  const hasSalePrice = item.variant.sale_price !== null;
  const maxStock = item.variant.stock_quantity;

  return (
    <div className="flex items-center gap-4 border-b py-4 last:border-b-0">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-gray-50">
        {item.variant.thumbnail_url ? (
          <img
            src={item.variant.thumbnail_url}
            alt={item.variant.product_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            No image
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="truncate text-sm font-medium text-gray-900">
          {item.variant.product_name}
        </h3>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
          {item.variant.option1 && (
            <span>{item.variant.option1_label ?? 'Option 1'}: {item.variant.option1}</span>
          )}
          {item.variant.option2 && (
            <span>{item.variant.option2_label ?? 'Option 2'}: {item.variant.option2}</span>
          )}
          <span>SKU: {item.variant.sku}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{formatPrice(effectivePrice)}</span>
          {hasSalePrice && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(item.variant.price)}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          disabled={isUpdating || item.quantity <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-md border text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          disabled={isUpdating || item.quantity >= maxStock}
          className="flex h-8 w-8 items-center justify-center rounded-md border text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="w-28 text-right text-sm font-medium text-gray-900">
        {formatPrice(getItemTotal(item))}
      </div>

      <button
        onClick={() => onRemove(item.id)}
        disabled={isUpdating}
        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
