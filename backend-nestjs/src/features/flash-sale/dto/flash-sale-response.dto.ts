import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FlashSaleItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  product_variant_id: number;

  @ApiProperty()
  flash_price: number;

  @ApiProperty()
  flash_quantity: number;

  @ApiProperty()
  sold_quantity: number;

  @ApiProperty({ description: 'Percent sold (0-100), rounded' })
  sold_percent: number;

  // Registration/moderation fields.
  @ApiProperty({ description: 'Owning shop id (seller who registered)' })
  shop_id: number;

  @ApiPropertyOptional({ description: 'Owning shop name (moderation view)' })
  shop_name?: string | null;

  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  status: string;

  @ApiPropertyOptional({ description: 'Reason given when rejected' })
  reject_reason?: string | null;

  // Product/variant display fields (present when the campaign is loaded with
  // product relations — detail/public views).
  @ApiPropertyOptional()
  product_id?: number | null;

  @ApiPropertyOptional()
  product_name?: string | null;

  @ApiPropertyOptional()
  product_slug?: string | null;

  @ApiPropertyOptional()
  thumbnail_url?: string | null;

  @ApiPropertyOptional()
  sku?: string | null;

  @ApiPropertyOptional({ description: 'Original variant price (pre-flash)' })
  original_price?: number | null;

  @ApiPropertyOptional()
  variant_option1_label?: string | null;

  @ApiPropertyOptional()
  variant_option1_value?: string | null;

  @ApiPropertyOptional()
  variant_option2_label?: string | null;

  @ApiPropertyOptional()
  variant_option2_value?: string | null;
}

export class FlashSaleResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Seller registration window opens' })
  registration_starts_at: Date;

  @ApiProperty({ description: 'Seller registration deadline (≤ starts_at)' })
  registration_ends_at: Date;

  @ApiProperty()
  starts_at: Date;

  @ApiProperty()
  ends_at: Date;

  @ApiProperty({ description: 'Mandatory minimum discount percent for registrations' })
  min_discount_percent: number;

  @ApiProperty({ enum: ['scheduled', 'active', 'ended'] })
  status: string;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  item_count: number;

  @ApiProperty({ description: 'Number of pending registrations (moderation badge)' })
  pending_count: number;

  @ApiProperty({ type: [FlashSaleItemResponseDto] })
  items: FlashSaleItemResponseDto[];

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
