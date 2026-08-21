import { Store } from 'lucide-react';
import { VoucherRow } from '@/features/coupon';
import type { AppliedCouponEntry } from '@/features/coupon';
import type { CartShopGrouping } from '../utils/cart.util';
import { CartItemRow } from './CartItemRow';

interface Props {
  group: CartShopGrouping;
  /** The shop voucher currently applied to this shop, if any. */
  appliedShopCoupon?: AppliedCouponEntry;
  /** Show the voucher row (auth-gated — coupon APIs need a logged-in customer). */
  showVoucher: boolean;
  onOpenVoucher: (shopId: number) => void;
  onRemoveCoupon: (code: string) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
  isUpdating: boolean;
}

/**
 * One shop's items in the cart, as a card: shop header, its item rows, and
 * (for authenticated customers) a shop-voucher row. Shop-grouped layout takes
 * cues from marketplace carts but uses this app's own brand/amber theme.
 */
export function CartShopGroup({
  group,
  appliedShopCoupon,
  showVoucher,
  onOpenVoucher,
  onRemoveCoupon,
  onUpdateQuantity,
  onRemove,
  isUpdating,
}: Props) {
  const canPickVoucher = showVoucher && group.shop_id != null;

  return (
    <div className="rounded-xl border border-border-default bg-white">
      <div className="flex items-center gap-2 border-b border-border-default px-4 py-3">
        <Store className="h-4 w-4 text-text-secondary" />
        <span className="text-sm font-semibold text-text-primary">
          {group.shop_name ?? 'Other items'}
        </span>
      </div>

      <div className="px-4">
        {group.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            isUpdating={isUpdating}
          />
        ))}
      </div>

      {canPickVoucher && (
        <div className="border-t border-border-default px-4 py-3">
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
