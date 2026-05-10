import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartItemVariantResponseDto {
  @ApiProperty()
  sku: string;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  sale_price: number | null;

  @ApiPropertyOptional()
  color: string | null;

  @ApiPropertyOptional()
  size: string | null;

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

  @ApiProperty({ type: CartItemVariantResponseDto })
  variant: CartItemVariantResponseDto;
}

export class CartResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];
}
