import { Store, Ticket, Check, X } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
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
          {appliedShopCoupon ? (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                <Check className="h-4 w-4 text-emerald-700" />
                {appliedShopCoupon.code}
                {appliedShopCoupon.validation.discount_type === 'percentage' ? (
                  <span className="text-xs font-normal text-emerald-700">
                    {appliedShopCoupon.validation.discount_value}% off
                  </span>
                ) : (
                  <span className="text-xs font-normal text-emerald-700">
                    {formatPrice(appliedShopCoupon.validation.discount_value)} off
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onOpenVoucher(group.shop_id as number)}
                  className="rounded px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveCoupon(appliedShopCoupon.code)}
                  className="rounded p-0.5 text-emerald-700 hover:bg-emerald-100"
                  aria-label={`Remove voucher ${appliedShopCoupon.code}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenVoucher(group.shop_id as number)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-white py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-brand hover:text-text-brand"
            >
              <Ticket className="h-4 w-4" />
              Select shop voucher
            </button>
          )}
        </div>
      )}
    </div>
  );
}
