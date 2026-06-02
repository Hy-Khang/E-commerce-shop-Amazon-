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
}

export interface IApplicableItemsResult {
  applicable_total: number;
  applicable_count: number;
}
