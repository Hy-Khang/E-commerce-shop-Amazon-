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

export interface IDiscountCalculation {
  coupon_id: number;
  coupon_code: string;
  discount_amount: number;
  // NULL = platform coupon; a shop id = shop coupon (discount confined to that shop).
  coupon_shop_id: number | null;
  // Applicable subtotal per shop id, used by checkout to distribute the discount.
  applicable_by_shop: Record<number, number>;
}

export interface IApplicableItemsResult {
  applicable_total: number;
  applicable_count: number;
}
