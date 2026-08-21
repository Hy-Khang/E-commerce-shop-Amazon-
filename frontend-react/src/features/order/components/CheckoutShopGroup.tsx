import { Store } from 'lucide-react';
import type { CartItem, CartShopGrouping } from '@/features/cart';
import { VoucherRow } from '@/features/coupon';
import type { AppliedCouponEntry } from '@/features/coupon';
import type { OrderItem } from '../types/order.types';
import { OrderItemRow } from './OrderItemRow';

interface Props {
  group: CartShopGrouping;
  /** The shop voucher currently applied to this shop, if any. */
  appliedShopCoupon?: AppliedCouponEntry;
  /** Show the voucher row (coupon APIs need a logged-in customer). */
  showVoucher: boolean;
  onOpenVoucher: (shopId: number) => void;
  onRemoveCoupon: (code: string) => void;
}

/** Cart line → read-only order-item shape for the checkout preview row. */
function toOrderItem(item: CartItem): OrderItem {
  return {
    id: item.id,
    order_id: 0,
    product_variant_id: item.product_variant_id,
    product_name: item.variant.product_name,
    sku: item.variant.sku,
    price: item.variant.sale_price ?? item.variant.price,
    quantity: item.quantity,
    thumbnail_url: item.variant.thumbnail_url,
    product_id: null,
    variant_option1_label: item.variant.option1_label,
    variant_option1_value: item.variant.option1,
    variant_option2_label: item.variant.option2_label,
    variant_option2_value: item.variant.option2,
    shop_id: item.shop_id,
    shop_name: item.shop_name,
    product_slug: null,
    shop_slug: null,
  };
}

/**
 * One shop's items on the checkout page, as a card: shop header, read-only item
 * rows, and (for authenticated customers) a shop-voucher row. Mirrors the Cart
 * page's `CartShopGroup` so both flows read identically; the difference is these
 * rows have no quantity controls (checkout is a confirmation, not an editor).
 */
export function CheckoutShopGroup({
  group,
  appliedShopCoupon,
  showVoucher,
  onOpenVoucher,
  onRemoveCoupon,
}: Props) {
  const canPickVoucher = showVoucher && group.shop_id != null;

  return (
    <div className="rounded-xl border border-border-default bg-elevated">
      <div className="flex items-center gap-2 border-b border-border-default px-6 py-3">
        <Store className="h-4 w-4 text-text-secondary" />
        <span className="text-sm font-semibold text-text-primary">
          {group.shop_name ?? 'Other items'}
        </span>
      </div>

      <div className="px-6">
        {group.items.map((item) => (
          <OrderItemRow key={item.id} item={toOrderItem(item)} />
        ))}
      </div>

      {canPickVoucher && (
        <div className="border-t border-border-default px-6 py-3">
          <VoucherRow
            applied={appliedShopCoupon}
            selectLabel="Select shop voucher"
            showDiscountLabel
            onOpen={() => onOpenVoucher(group.shop_id as number)}
            onRemove={onRemoveCoupon}
          />
        </div>
      )}
    </div>
  );
}
