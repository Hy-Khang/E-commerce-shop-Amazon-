import { Store } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import type { CheckoutPreviewShop } from '../types/order.types';

interface CheckoutShopBreakdownProps {
  shops: CheckoutPreviewShop[];
}

/**
 * Per-shop split of a multi-shop checkout — each shop becomes its own order, so
 * we show how items, discount and shipping break down per shop. Sourced from the
 * server preview (exact). Rendered only when the cart spans more than one shop.
 */
export function CheckoutShopBreakdown({ shops }: CheckoutShopBreakdownProps) {
  if (shops.length <= 1) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
        <Store className="h-3.5 w-3.5" />
        Order breakdown by shop ({shops.length})
      </p>
      {shops.map((shop) => (
        <div
          key={shop.shop_id}
          className="space-y-1 rounded-lg border border-border-default bg-white p-3"
        >
          <p className="truncate text-sm font-medium text-text-primary">
            {shop.shop_name || `Shop #${shop.shop_id}`}
          </p>
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Items</span>
            <span>{formatPrice(shop.items_total)}</span>
          </div>
          {shop.discount_amount > 0 && (
            <div className="flex justify-between text-xs text-emerald-700">
              <span>Discount</span>
              <span>-{formatPrice(shop.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Shipping</span>
            <span>{formatPrice(shop.shipping_fee)}</span>
          </div>
          <div className="flex justify-between border-t border-border-default pt-1 text-xs font-semibold text-text-primary">
            <span>Order total</span>
            <span>{formatPrice(shop.total)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
