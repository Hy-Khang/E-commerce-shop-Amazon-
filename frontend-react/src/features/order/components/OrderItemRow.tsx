import { formatPrice } from '@/common/utils/format.util';
import type { OrderItem } from '../types/order.types';
import { calculateItemSubtotal } from '../utils/order.util';

interface Props {
  item: OrderItem;
}

export function OrderItemRow({ item }: Props) {
  return (
    <div className="flex items-center gap-4 border-b py-4 last:border-b-0">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-gray-50">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.product_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            No image
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="truncate text-sm font-medium text-gray-900">{item.product_name}</h4>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-500">
          <span>SKU: {item.sku}</span>
          {item.variant_option1_label && item.variant_option1_value && (
            <span>{item.variant_option1_label}: {item.variant_option1_value}</span>
          )}
          {item.variant_option2_label && item.variant_option2_value && (
            <span>{item.variant_option2_label}: {item.variant_option2_value}</span>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        {formatPrice(item.price)} x {item.quantity}
      </div>

      <div className="w-28 text-right text-sm font-medium text-gray-900">
        {formatPrice(calculateItemSubtotal(item))}
      </div>
    </div>
  );
}
