import { Coupon } from '../entities/coupon.entity';
import { CouponUsage } from '../entities/coupon-usage.entity';
import { DiscountType, CouponScope } from '../types/coupon.types';
import {
  CouponResponseDto,
  CouponUsageResponseDto,
  CouponValidationResponseDto,
} from '../dto/coupon-response.dto';

export function calculateDiscount(
  coupon: Coupon,
  applicableTotal: number,
): number {
  let discount: number;

  if (coupon.discount_type === DiscountType.Fixed) {
    discount = Number(coupon.discount_value);
  } else {
    discount = applicableTotal * (Number(coupon.discount_value) / 100);
    if (coupon.max_discount_amount != null) {
      discount = Math.min(discount, Number(coupon.max_discount_amount));
    }
  }

  discount = Math.min(discount, applicableTotal);

  return Math.round(discount * 100) / 100;
}

export function toCouponResponse(coupon: Coupon): CouponResponseDto {
  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description ?? null,
    discount_type: coupon.discount_type,
    discount_value: Number(coupon.discount_value),
    scope: coupon.scope,
    category_ids:
      coupon.scope === CouponScope.Categories && coupon.coupon_categories
        ? coupon.coupon_categories.map((cc) => cc.category_id)
        : null,
    product_ids:
      coupon.scope === CouponScope.Products && coupon.coupon_products
        ? coupon.coupon_products.map((cp) => cp.product_id)
        : null,
    min_order_amount:
      coupon.min_order_amount != null
        ? Number(coupon.min_order_amount)
        : null,
    max_discount_amount:
      coupon.max_discount_amount != null
        ? Number(coupon.max_discount_amount)
        : null,
    max_uses: coupon.max_uses ?? null,
    max_uses_per_user: coupon.max_uses_per_user,
    current_uses: coupon.current_uses,
    starts_at: coupon.starts_at,
    expires_at: coupon.expires_at,
    is_active: coupon.is_active,
    created_at: coupon.created_at,
    updated_at: coupon.updated_at,
  };
}

export function toCouponValidationResponse(
  coupon: Coupon,
): CouponValidationResponseDto {
  return {
    valid: true,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: Number(coupon.discount_value),
    max_discount_amount:
      coupon.max_discount_amount != null
        ? Number(coupon.max_discount_amount)
        : null,
    min_order_amount:
      coupon.min_order_amount != null
        ? Number(coupon.min_order_amount)
        : null,
    scope: coupon.scope,
    applicable_category_ids:
      coupon.scope === CouponScope.Categories && coupon.coupon_categories
        ? coupon.coupon_categories.map((cc) => cc.category_id)
        : null,
    applicable_product_ids:
      coupon.scope === CouponScope.Products && coupon.coupon_products
        ? coupon.coupon_products.map((cp) => cp.product_id)
        : null,
  };
}

export function toCouponUsageResponse(
  usage: CouponUsage,
): CouponUsageResponseDto {
  return {
    id: usage.id,
    coupon_code: usage.coupon?.code ?? '',
    user_id: usage.user_id,
    user_email: usage.user?.email,
    order_id: usage.order_id,
    discount_amount: Number(usage.discount_amount),
    status: usage.status,
    created_at: usage.created_at,
  };
}
