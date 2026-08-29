import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartItemVariantResponseDto {
  @ApiProperty()
  sku: string;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  sale_price: number | null;

  @ApiPropertyOptional({
    description: 'Active flash-sale unit price (null when not on flash sale)',
  })
  flash_price: number | null;

  @ApiPropertyOptional()
  option1: string | null;

  @ApiPropertyOptional()
  option2: string | null;

  @ApiPropertyOptional()
  option1_label: string | null;

  @ApiPropertyOptional()
  option2_label: string | null;

  @ApiProperty()
  stock_quantity: number;

  @ApiProperty()
  product_name: string;

  @ApiPropertyOptional()
  thumbnail_url: string | null;
}

export class CartItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  product_variant_id: number;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional({ description: 'Owning shop id (null for legacy items)' })
  shop_id: number | null;

  @ApiPropertyOptional({ description: 'Owning shop name snapshot' })
  shop_name: string | null;

  @ApiProperty({ type: CartItemVariantResponseDto })
  variant: CartItemVariantResponseDto;
}

export class CartResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];
}
