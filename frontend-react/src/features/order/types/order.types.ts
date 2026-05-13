import { z } from 'zod';
import type { PaginationParams } from '@/common/types/common.types';

// --- Shared sub-types ---

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cod' | 'banking' | 'momo';
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
  product_name: string;
  sku: string;
  price: number;
  quantity: number;
  thumbnail_url: string | null;
}

export interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  shipping_fee: number;
  total_amount: number;
  shipping_address: ShippingAddress;
  order_items: OrderItem[];
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
  // Customer orders are filtered by JWT user_id automatically
}

export interface AdminOrderListParams extends PaginationParams {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  user_id?: number;
}

// --- Request types ---

export interface CreateOrderRequest {
  payment_method: PaymentMethod;
  address_id: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface UpdatePaymentStatusRequest {
  payment_status: PaymentStatus;
}

// --- Zod schemas (forms) ---

export const checkoutSchema = z.object({
  payment_method: z.enum(['cod', 'banking', 'momo'], {
    required_error: 'Payment method is required',
  }),
  address_id: z.number({ required_error: 'Please select a shipping address' }).int().positive(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
