import { useNavigate } from 'react-router-dom';
import { formatPrice } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import {
  VoucherRow,
  estimateCouponDiscount,
  useAppliedCouponsStore,
} from '@/features/coupon';
import type { CartItem } from '../types/cart.types';
import { calculateSubtotal, groupItemsByShop } from '../utils/cart.util';

interface Props {
  items: CartItem[];
  /** Show the platform-voucher row (auth-gated). */
  showVoucher: boolean;
  onOpenPlatformVoucher: () => void;
}

export function CartSummary({ items, showVoucher, onOpenPlatformVoucher }: Props) {
  const navigate = useNavigate();
  const appliedCoupons = useAppliedCouponsStore((s) => s.appliedCoupons);
  const removeCoupon = useAppliedCouponsStore((s) => s.remove);

  const subtotal = calculateSubtotal(items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const platformCoupon = appliedCoupons.find(
    (c) => c.validation.shop_id == null,
  );

  // Advisory estimate only: shop coupons apply to their own shop's subtotal,
  // the platform coupon to the whole subtotal. The exact figure (incl. the
  // platform waterfall across shops) is confirmed at checkout/preview.
  const shopSubtotals = new Map<number, number>();
  for (const group of groupItemsByShop(items)) {
    if (group.shop_id != null) {
      shopSubtotals.set(group.shop_id, calculateSubtotal(group.items));
    }
  }
  const estimatedDiscount = Math.min(
    appliedCoupons.reduce((sum, c) => {
      const shopId = c.validation.shop_id;
      const base = shopId == null ? subtotal : shopSubtotals.get(shopId) ?? 0;
      return sum + estimateCouponDiscount(c.validation, base);
    }, 0),
    subtotal,
  );

  return (
    <div className="rounded-xl border border-border-default bg-white p-6">
      <h2 className="text-lg font-bold tracking-tight text-text-primary">Order Summary</h2>

      {showVoucher && (
        <div className="mt-4 border-b border-border-default pb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Platform voucher
          </p>
          <VoucherRow
            applied={platformCoupon}
            selectLabel="Select platform voucher"
            onOpen={onOpenPlatformVoucher}
            onRemove={removeCoupon}
          />
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm text-text-secondary">
          <span>Items ({itemCount})</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {estimatedDiscount > 0 && (
          <div className="flex justify-between text-sm text-emerald-700">
            <span>Discount (est.)</span>
            <span>-{formatPrice(estimatedDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-text-secondary">
          <span>Shipping</span>
          <span className="text-text-muted">Calculated at checkout</span>
        </div>
      </div>

      <div className="mt-4 border-t border-border-default pt-4">
        <div className="flex justify-between text-base font-bold text-text-primary">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal - estimatedDiscount)}</span>
        </div>
        {estimatedDiscount > 0 && (
          <p className="mt-1 text-xs text-text-muted">
            ≈ estimate · confirmed at checkout
          </p>
        )}
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
