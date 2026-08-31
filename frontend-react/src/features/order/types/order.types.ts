import { z } from 'zod';
import type { PaginationParams } from '@/common/types/common.types';

// --- Shared sub-types ---

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'completed' | 'return_requested' | 'cancelled';
export type PaymentMethod = 'cod' | 'vnpay' | 'momo';
export type PaymentStatus = 'unpaid' | 'paid';

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Address {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
}

// --- Response types ---

export interface OrderItem {
  id: number;
  order_id: number;
  product_variant_id: number | null;
  product_id: number | null;
  product_name: string;
  sku: string;
  price: number;
  quantity: number;
  thumbnail_url: string | null;
  variant_option1_label: string | null;
  variant_option1_value: string | null;
  variant_option2_label: string | null;
  variant_option2_value: string | null;
  shop_id: number | null;
  shop_name: string | null;
  product_slug: string | null;
  shop_slug: string | null;
}

export interface AppliedCoupon {
  code: string;
  discount_amount: number;
}

export interface Order {
  id: number;
  user_id: number;
  shop_id: number;
  shop_name: string;
  order_group_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  shipping_fee: number;
  coupon_code: string | null;
  discount_amount: number;
  /** Xu (Hoàn Xu) redeemed against this order. */
  coin_discount: number;
  // Full breakdown of coupons applied to this order (platform + shop).
  applied_coupons?: AppliedCoupon[];
  total_amount: number;
  shipping_address: ShippingAddress;
  order_items: OrderItem[];
  delivered_at: string | null;
  created_at: string;
}

export interface OrderListItem {
  id: number;
  shop_id: number;
  shop_name: string;
  order_group_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  shipping_fee: number;
  coupon_code: string | null;
  discount_amount: number;
  coin_discount: number;
  total_amount: number;
  delivered_at: string | null;
  created_at: string;
}

export interface CheckoutResponse {
  order_group_id: string;
  orders: Order[];
  total_amount: number;
}

// --- Checkout preview (advisory estimate; POST /orders is source of truth) ---

export interface CheckoutPreviewShop {
  shop_id: number;
  shop_name: string;
  items_total: number;
  discount_amount: number;
  coin_discount: number;
  shipping_fee: number;
  total: number;
  coupons: AppliedCoupon[];
}

export interface CheckoutPreview {
  subtotal: number;
  discount_total: number;
  /** Total Xu redeemed across all shops (actually applied). */
  coin_discount: number;
  /** Xu actually applied — may be < requested when coupons leave little headroom. */
  coins_applied: number;
  shipping_total: number;
  grand_total: number;
  shops: CheckoutPreviewShop[];
  applied_coupons: AppliedCoupon[];
}

export interface PreviewOrderRequest {
  coupon_code?: string;
  coupon_codes?: string[];
  coins_to_redeem?: number;
}

export interface OrderListItemWithItems extends OrderListItem {
  order_items: OrderItem[];
}

export interface AdminOrderDetail extends Order {
  user?: {
    id: number;
    email: string;
    full_name: string;
    phone: string | null;
  };
}

// --- Query params ---

export interface OrderListParams extends PaginationParams {
  status?: OrderStatus;
}

export interface AdminOrderListParams extends PaginationParams {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  user_id?: number;
  search?: string;
}

export interface SellerOrderListParams extends PaginationParams {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  search?: string;
}

export interface SellerOrderDetail extends Order {
  user_id: number;
  user_email?: string;
  user_full_name?: string;
  seller_items_count: number;
  seller_items_total: number;
}

export interface ShipperOrderListParams extends PaginationParams {
  filter?: 'available' | 'my_deliveries';
  status?: OrderStatus;
}

// --- Request types ---

export interface CreateOrderRequest {
  payment_method: PaymentMethod;
  address_id: number;
  /** Legacy single coupon — prefer coupon_codes. */
  coupon_code?: string;
  /** Multi-coupon: ≤1 platform + ≤1 per shop. */
  coupon_codes?: string[];
  /** Xu (Hoàn Xu) to redeem — capped at 50% of items total & balance. */
  coins_to_redeem?: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface UpdatePaymentStatusRequest {
  payment_status: PaymentStatus;
}

// --- Zod schemas (forms) ---

export const checkoutSchema = z.object({
  payment_method: z.enum(['cod', 'vnpay', 'momo'], {
    error: 'Payment method is required',
  }),
  address_id: z.number({ error: 'Please select a shipping address' }).int().positive(),
  coupon_code: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
