import { Order } from '../entities/order.entity';
import {
  OrderResponseDto,
  OrderListItemResponseDto,
  AdminOrderResponseDto,
  OrderItemResponseDto,
} from '../dto/order-response.dto';
import type { IShippingAddressSnapshot } from '../types/order.types';

function parseShippingAddress(raw: string): IShippingAddressSnapshot {
  return JSON.parse(raw);
}

function toOrderItemResponse(item: {
  id: number;
  product_name: string;
  sku: string;
  price: number;
  quantity: number;
  thumbnail_url: string | null;
  product_variant_id: number | null;
  product_variant?: { product_id: number } | null;
}): OrderItemResponseDto {
  return {
    id: item.id,
    product_name: item.product_name,
    sku: item.sku,
    price: Number(item.price),
    quantity: item.quantity,
    thumbnail_url: item.thumbnail_url,
    product_variant_id: item.product_variant_id,
    product_id: item.product_variant?.product_id ?? null,
  };
}

export function toOrderResponse(order: Order): OrderResponseDto {
  return {
    id: order.id,
    status: order.status,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    shipping_fee: Number(order.shipping_fee),
    coupon_code: order.coupon_code ?? null,
    discount_amount: Number(order.discount_amount ?? 0),
    total_amount: Number(order.total_amount),
    shipping_address: parseShippingAddress(order.shipping_address),
    order_items: (order.order_items || []).map(toOrderItemResponse),
    created_at: order.created_at,
  };
}

export function toOrderListItemResponse(order: Order): OrderListItemResponseDto {
  return {
    id: order.id,
    status: order.status,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    shipping_fee: Number(order.shipping_fee),
    coupon_code: order.coupon_code ?? null,
    discount_amount: Number(order.discount_amount ?? 0),
    total_amount: Number(order.total_amount),
    created_at: order.created_at,
  };
}

export function toAdminOrderResponse(order: Order): AdminOrderResponseDto {
  return {
    ...toOrderResponse(order),
    user_id: order.user_id,
    user_email: order.user?.email,
    user_full_name: order.user?.full_name,
  };
}
