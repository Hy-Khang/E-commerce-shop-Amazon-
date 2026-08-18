import { z } from 'zod';
import type { PaginationParams } from '@/common/types/common.types';

// --- Enums ---

export type DiscountType = 'fixed' | 'percentage';
export type CouponScope = 'all' | 'categories' | 'products';
export type CouponUsageStatus = 'applied' | 'reversed';

// --- Response types ---

export interface CouponShopSummary {
  id: number;
  name: string;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number | null;
  scope: CouponScope;
  applicable_category_ids: number[] | null;
  applicable_product_ids: number[] | null;
  // NULL = platform coupon; otherwise the owning shop id (used to group coupons at checkout).
  shop_id?: number | null;
}

export interface Coupon {
  id: number;
  code: string;
  // NULL = platform coupon; otherwise the owning shop.
  shop_id: number | null;
  shop: CouponShopSummary | null;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  scope: CouponScope;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  max_uses: number | null;
  max_uses_per_user: number;
  current_uses: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  category_ids: number[] | null;
  product_ids: number[] | null;
  created_at: string;
}

export interface CouponUsage {
  id: number;
  coupon_id: number;
  coupon_code?: string;
  user_id: number;
  user_email?: string;
  order_id: number;
  discount_amount: number;
  status: CouponUsageStatus;
  created_at: string;
}

// --- Query params ---

export interface CouponListParams extends PaginationParams {
  search?: string;
  scope?: CouponScope;
  discount_type?: DiscountType;
  is_active?: boolean;
  // Admin-only ownership filters (ignored by the shop-scoped seller endpoint).
  owner?: 'platform' | 'shop';
  shop_id?: number;
}

// --- Seller request types (no category scope, no shop_id — resolved server-side) ---

export interface CreateSellerCouponRequest {
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  scope: 'all' | 'products';
  product_ids?: number[];
  min_order_amount?: number | null;
  max_discount_amount?: number | null;
  max_uses?: number | null;
  max_uses_per_user?: number;
  starts_at: string;
  expires_at: string;
}

export interface UpdateSellerCouponRequest {
  description?: string;
  discount_type?: DiscountType;
  discount_value?: number;
  scope?: 'all' | 'products';
  product_ids?: number[];
  min_order_amount?: number | null;
  max_discount_amount?: number | null;
  max_uses?: number | null;
  max_uses_per_user?: number;
  starts_at?: string;
  expires_at?: string;
  is_active?: boolean;
}

export interface CouponUsageListParams extends PaginationParams {
  coupon_id?: number;
  user_id?: number;
}

// --- Request types ---

export interface ValidateCouponRequest {
  code: string;
}

export interface CreateCouponRequest {
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  scope: CouponScope;
  category_ids?: number[];
  product_ids?: number[];
  min_order_amount?: number | null;
  max_discount_amount?: number | null;
  max_uses?: number | null;
  max_uses_per_user?: number;
  starts_at: string;
  expires_at: string;
}

export interface UpdateCouponRequest {
  description?: string;
  discount_type?: DiscountType;
  discount_value?: number;
  scope?: CouponScope;
  category_ids?: number[];
  product_ids?: number[];
  min_order_amount?: number | null;
  max_discount_amount?: number | null;
  max_uses?: number | null;
  max_uses_per_user?: number;
  starts_at?: string;
  expires_at?: string;
  is_active?: boolean;
}

// --- Zod schemas (forms) ---

export const createCouponSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50).transform((v) => v.toUpperCase()),
  description: z.string().max(255).optional(),
  discount_type: z.enum(['fixed', 'percentage'], { error: 'Discount type is required' }),
  discount_value: z.number({ error: 'Discount value is required' }).positive('Must be positive'),
  scope: z.enum(['all', 'categories', 'products'], { error: 'Scope is required' }),
  category_ids: z.array(z.number()).optional(),
  product_ids: z.array(z.number()).optional(),
  min_order_amount: z.number().positive().nullable().optional(),
  max_discount_amount: z.number().positive().nullable().optional(),
  max_uses: z.number().int().positive().nullable().optional(),
  max_uses_per_user: z.number().int().positive(),
  starts_at: z.string().min(1, 'Start date is required'),
  expires_at: z.string().min(1, 'End date is required'),
}).refine(
  (data) => new Date(data.expires_at) > new Date(data.starts_at),
  { message: 'End date must be after start date', path: ['expires_at'] },
).refine(
  (data) => data.discount_type !== 'percentage' || data.discount_value <= 100,
  { message: 'Percentage cannot exceed 100', path: ['discount_value'] },
).refine(
  (data) => data.scope !== 'categories' || (data.category_ids && data.category_ids.length > 0),
  { message: 'At least one category must be selected', path: ['category_ids'] },
).refine(
  (data) => data.scope !== 'products' || (data.product_ids && data.product_ids.length > 0),
  { message: 'At least one product must be selected', path: ['product_ids'] },
);

export type CreateCouponFormData = z.infer<typeof createCouponSchema>;
