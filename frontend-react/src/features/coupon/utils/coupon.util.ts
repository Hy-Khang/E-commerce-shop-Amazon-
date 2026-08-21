import type { CouponOption, CouponValidationResult } from '../types/coupon.types';

/**
 * Adapts a selected `CouponOption` (from the availability catalog) into the
 * `CouponValidationResult` shape the checkout page consumes for applied coupons
 * (`AppliedCouponEntry.validation`). CheckoutPage only reads `code`,
 * `discount_type`, `discount_value`, `max_discount_amount`, `min_order_amount`
 * (local fallback estimate) and `shop_id` (group key) — never `scope` or the
 * `applicable_*_ids`, so those are safely `null`. The real numbers still come
 * from the server preview; this is only the fallback estimate + group key.
 */
export function optionToValidation(o: CouponOption): CouponValidationResult {
  return {
    valid: true,
    code: o.code,
    discount_type: o.discount_type,
    discount_value: o.discount_value,
    max_discount_amount: o.max_discount_amount,
    min_order_amount: o.min_order_amount,
    scope: o.scope,
    applicable_category_ids: null,
    applicable_product_ids: null,
    shop_id: o.shop_id,
  };
}

/**
 * Advisory client-side estimate of a coupon's discount against an applicable
 * subtotal. Below `min_order_amount` → 0; percentage capped at
 * `max_discount_amount`; clamped to the subtotal so it never over-discounts.
 * This is only a preview — the server's `POST /orders/preview` and checkout are
 * the source of truth (they also apply the platform waterfall across shops,
 * which this per-coupon estimate cannot see).
 */
export function estimateCouponDiscount(
  v: CouponValidationResult,
  applicableSubtotal: number,
): number {
  if (v.min_order_amount && applicableSubtotal < v.min_order_amount) return 0;

  let discount: number;
  if (v.discount_type === 'percentage') {
    discount = (applicableSubtotal * v.discount_value) / 100;
    if (v.max_discount_amount) {
      discount = Math.min(discount, v.max_discount_amount);
    }
  } else {
    discount = v.discount_value;
  }

  return Math.min(discount, applicableSubtotal);
}
