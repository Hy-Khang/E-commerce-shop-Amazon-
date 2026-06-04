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

  @ApiProperty({ type: ShippingAddressResponseDto })
  shipping_address: ShippingAddressResponseDto;

  @ApiProperty({ type: [OrderItemResponseDto] })
  order_items: OrderItemResponseDto[];

  @ApiProperty()
  created_at: Date;
}

export class OrderListItemResponseDto {
  @ApiProperty()
  id: number;

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
}

export class AdminOrderResponseDto extends OrderResponseDto {
  @ApiProperty()
  user_id: number;

  @ApiPropertyOptional()
  user_email?: string;

  @ApiPropertyOptional()
  user_full_name?: string;
}
