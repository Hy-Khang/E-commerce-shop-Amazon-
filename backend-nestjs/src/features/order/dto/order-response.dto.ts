import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  product_name: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional()
  thumbnail_url: string | null;

  @ApiPropertyOptional()
  product_variant_id: number | null;

  @ApiPropertyOptional()
  product_id: number | null;

  @ApiPropertyOptional()
  variant_option1_label: string | null;

  @ApiPropertyOptional()
  variant_option1_value: string | null;

  @ApiPropertyOptional()
  variant_option2_label: string | null;

  @ApiPropertyOptional()
  variant_option2_value: string | null;

  @ApiPropertyOptional()
  shop_id: number | null;

  @ApiPropertyOptional()
  shop_name: string | null;

  @ApiPropertyOptional()
  product_slug: string | null;

  @ApiPropertyOptional()
  shop_slug: string | null;
}

export class AppliedCouponResponseDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  discount_amount: number;
}

export class ShippingAddressResponseDto {
  @ApiProperty()
  full_name: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  address_line: string;

  @ApiProperty()
  city: string;
}

export class OrderResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  shop_id: number;

  @ApiProperty()
  shop_name: string;

  @ApiProperty()
  order_group_id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  payment_method: string;

  @ApiProperty()
  payment_status: string;

  @ApiProperty()
  shipping_fee: number;

  @ApiPropertyOptional()
  coupon_code: string | null;

  @ApiProperty()
  discount_amount: number;

  @ApiPropertyOptional({
    type: [AppliedCouponResponseDto],
    description: 'All coupons applied to this order (platform + shop breakdown)',
  })
  applied_coupons?: AppliedCouponResponseDto[];

  @ApiProperty()
  total_amount: number;

  @ApiProperty({ type: ShippingAddressResponseDto })
  shipping_address: ShippingAddressResponseDto;

  @ApiProperty({ type: [OrderItemResponseDto] })
  order_items: OrderItemResponseDto[];

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional()
  delivered_at: Date | null;
}

export class OrderListItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  shop_id: number;

  @ApiProperty()
  shop_name: string;

  @ApiProperty()
  order_group_id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  payment_method: string;

  @ApiProperty()
  payment_status: string;

  @ApiProperty()
  shipping_fee: number;

  @ApiPropertyOptional()
  coupon_code: string | null;

  @ApiProperty()
  discount_amount: number;

  @ApiProperty()
  total_amount: number;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional()
  delivered_at: Date | null;
}

export class OrderListItemWithItemsResponseDto extends OrderListItemResponseDto {
  @ApiProperty({ type: [OrderItemResponseDto] })
  order_items: OrderItemResponseDto[];
}

export class AdminOrderResponseDto extends OrderResponseDto {
  @ApiProperty()
  user_id: number;

  @ApiPropertyOptional()
  user_email?: string;

  @ApiPropertyOptional()
  user_full_name?: string;
}

export class SellerOrderResponseDto extends OrderResponseDto {
  @ApiProperty()
  user_id: number;

  @ApiPropertyOptional()
  user_email?: string;

  @ApiPropertyOptional()
  user_full_name?: string;

  @ApiProperty({ description: 'Number of items in this order belonging to the seller' })
  seller_items_count: number;

  @ApiProperty({ description: 'Total revenue from seller items only' })
  seller_items_total: number;
}

export class CheckoutResponseDto {
  @ApiProperty()
  order_group_id: string;

  @ApiProperty({ type: [OrderResponseDto] })
  orders: OrderResponseDto[];

  @ApiProperty()
  total_amount: number;
}

export class CheckoutPreviewShopDto {
  @ApiProperty()
  shop_id: number;

  @ApiProperty()
  shop_name: string;

  @ApiProperty({ description: 'Gross items subtotal for this shop' })
  items_total: number;

  @ApiProperty({ description: 'Total discount applied to this shop' })
  discount_amount: number;

  @ApiProperty()
  shipping_fee: number;

  @ApiProperty({ description: 'items_total − discount_amount + shipping_fee' })
  total: number;

  @ApiProperty({
    type: [AppliedCouponResponseDto],
    description: 'Coupons discounting this shop (shop coupon + platform share)',
  })
  coupons: AppliedCouponResponseDto[];
}

/**
 * Advisory checkout estimate returned by `POST /orders/preview`. Exact at the
 * time of the call but NOT a reservation — `POST /orders` re-validates and is
 * the only source of truth (a coupon may run out or expire in between).
 */
export class CheckoutPreviewResponseDto {
  @ApiProperty({ description: 'Gross items subtotal across all shops' })
  subtotal: number;

  @ApiProperty({ description: 'Total discount across all coupons' })
  discount_total: number;

  @ApiProperty({ description: 'Total shipping across all shops' })
  shipping_total: number;

  @ApiProperty({ description: 'subtotal − discount_total + shipping_total' })
  grand_total: number;

  @ApiProperty({ type: [CheckoutPreviewShopDto] })
  shops: CheckoutPreviewShopDto[];

  @ApiProperty({
    type: [AppliedCouponResponseDto],
    description: 'Per-coupon discount totals across the whole cart',
  })
  applied_coupons: AppliedCouponResponseDto[];
}
