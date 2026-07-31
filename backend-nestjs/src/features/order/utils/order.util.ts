import { Order } from '../entities/order.entity';
import {
  OrderResponseDto,
  OrderListItemResponseDto,
  OrderListItemWithItemsResponseDto,
  AdminOrderResponseDto,
  SellerOrderResponseDto,
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
  product_variant?: {
    product_id: number;
    product?: { slug: string; shop?: { slug: string } | null } | null;
  } | null;
  variant_option1_label?: string | null;
  variant_option1_value?: string | null;
  variant_option2_label?: string | null;
  variant_option2_value?: string | null;
  shop_id?: number | null;
  shop_name?: string | null;
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
    product_slug: item.product_variant?.product?.slug ?? null,
    shop_slug: item.product_variant?.product?.shop?.slug ?? null,
    variant_option1_label: item.variant_option1_label ?? null,
    variant_option1_value: item.variant_option1_value ?? null,
    variant_option2_label: item.variant_option2_label ?? null,
    variant_option2_value: item.variant_option2_value ?? null,
    shop_id: item.shop_id ?? null,
    shop_name: item.shop_name ?? null,
  };
}

export function toOrderResponse(order: Order): OrderResponseDto {
  return {
    id: order.id,
    shop_id: order.shop_id,
    shop_name: order.shop_name,
    order_group_id: order.order_group_id,
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
    delivered_at: order.delivered_at ?? null,
  };
}

export function toOrderListItemResponse(order: Order): OrderListItemResponseDto {
  return {
    id: order.id,
    shop_id: order.shop_id,
    shop_name: order.shop_name,
    order_group_id: order.order_group_id,
    status: order.status,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    shipping_fee: Number(order.shipping_fee),
    coupon_code: order.coupon_code ?? null,
    discount_amount: Number(order.discount_amount ?? 0),
    total_amount: Number(order.total_amount),
    created_at: order.created_at,
    delivered_at: order.delivered_at ?? null,
  };
}

export function toOrderListItemWithItemsResponse(
  order: Order,
): OrderListItemWithItemsResponseDto {
  return {
    ...toOrderListItemResponse(order),
    order_items: (order.order_items || []).map(toOrderItemResponse),
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

export function toSellerOrderResponse(
  order: Order,
): SellerOrderResponseDto {
  const items = order.order_items || [];
  const sellerItemsTotal = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  const base = toOrderResponse(order);
  return {
    ...base,
    user_id: order.user_id,
    user_email: order.user?.email,
    user_full_name: order.user?.full_name,
    seller_items_count: items.length,
    seller_items_total: sellerItemsTotal,
  };
}
