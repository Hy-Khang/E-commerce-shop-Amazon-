import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CouponValidationResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty()
  code: string;

  @ApiProperty()
  discount_type: string;

  @ApiProperty()
  discount_value: number;

  @ApiPropertyOptional()
  max_discount_amount: number | null;

  @ApiPropertyOptional()
  min_order_amount: number | null;

  @ApiProperty()
  scope: string;

  @ApiPropertyOptional({ type: [Number] })
  applicable_category_ids: number[] | null;

  @ApiPropertyOptional({ type: [Number] })
  applicable_product_ids: number[] | null;
}

export class CouponResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  discount_type: string;

  @ApiProperty()
  discount_value: number;

  @ApiProperty()
  scope: string;

  @ApiPropertyOptional({ type: [Number] })
  category_ids: number[] | null;

  @ApiPropertyOptional({ type: [Number] })
  product_ids: number[] | null;

  @ApiPropertyOptional()
  min_order_amount: number | null;

  @ApiPropertyOptional()
  max_discount_amount: number | null;

  @ApiPropertyOptional()
  max_uses: number | null;

  @ApiProperty()
  max_uses_per_user: number;

  @ApiProperty()
  current_uses: number;

  @ApiProperty()
  starts_at: Date;

  @ApiProperty()
  expires_at: Date;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class CouponUsageResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  coupon_code: string;

  @ApiProperty()
  user_id: number;

  @ApiPropertyOptional()
  user_email?: string;

  @ApiProperty()
  order_id: number;

  @ApiProperty()
  discount_amount: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  created_at: Date;
}
