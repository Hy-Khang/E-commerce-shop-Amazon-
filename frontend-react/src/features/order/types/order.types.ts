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
}

export interface Address {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
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

export interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  shipping_fee: number;
  coupon_code: string | null;
  discount_amount: number;
  total_amount: number;
  shipping_address: ShippingAddress;
  order_items: OrderItem[];
  delivered_at: string | null;
  created_at: string;
}

export interface OrderListItem {
  id: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  total_amount: number;
  created_at: string;
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
}

export interface SellerOrderListParams extends PaginationParams {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
}

export interface SellerOrderDetail extends Order {
  user_id: number;
  user_email?: string;
  user_full_name?: string;
  seller_items_count: number;
  seller_items_total: number;
}

// --- Request types ---

export interface CreateOrderRequest {
  payment_method: PaymentMethod;
  address_id: number;
  coupon_code?: string;
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
