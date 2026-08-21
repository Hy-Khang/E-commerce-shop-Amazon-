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
