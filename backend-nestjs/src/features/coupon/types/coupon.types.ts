export enum DiscountType {
  Fixed = 'fixed',
  Percentage = 'percentage',
}

export enum CouponScope {
  All = 'all',
  Categories = 'categories',
  Products = 'products',
}

export enum CouponUsageStatus {
  Applied = 'applied',
  Reversed = 'reversed',
}

export enum CouponSortBy {
  CreatedAt = 'created_at',
  ExpiresAt = 'expires_at',
  Code = 'code',
  CurrentUses = 'current_uses',
}

export interface IApplicableItemsResult {
  applicable_total: number;
  applicable_count: number;
}

/**
 * A single validated coupon's contribution, produced by
 * `validateAndCalculateDiscounts` for multi-coupon checkout. Each coupon is
 * calculated independently on the original subtotal.
 */
export interface ICouponCalculationItem {
  coupon_id: number;
  coupon_code: string;
  // NULL = platform coupon; a shop id = shop coupon (discount confined to that shop).
  coupon_shop_id: number | null;
  // Total discount this coupon yields across the whole cart.
  discount_amount: number;
  // Applicable subtotal per shop id (used by checkout to distribute a platform discount).
  applicable_by_shop: Record<number, number>;
}

/** A coupon applied to an order, exposed on order detail. */
export interface IAppliedCoupon {
  code: string;
  discount_amount: number;
}

/**
 * Why a coupon in the availability catalog is not selectable for the current
 * cart. Only these three surface to the customer — expired / inactive /
 * exhausted / shop-inactive coupons are hidden by the repository, never shown.
 */
export type CouponIneligibleReason =
  | 'below_min'
  | 'no_applicable_items'
  | 'user_limit';
