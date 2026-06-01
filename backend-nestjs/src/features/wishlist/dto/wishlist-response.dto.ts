import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WishlistItemResponseDto {
  @ApiProperty()
  product_id: number;

  @ApiProperty()
  product_name: string;

  @ApiProperty()
  product_slug: string;

  @ApiPropertyOptional()
  product_thumbnail_url: string | null;

  @ApiProperty()
  product_is_active: boolean;

  @ApiPropertyOptional({ description: 'Lowest current price across all variants' })
  min_price: number | null;

  @ApiPropertyOptional({ description: 'Lowest sale price across all variants (if any)' })
  min_sale_price: number | null;

  @ApiProperty()
  added_at: Date;
}

export class WishlistCheckResponseDto {
  @ApiProperty()
  in_wishlist: boolean;
}

export class BulkCheckResponseDto {
  @ApiProperty({ description: 'Map of product_id to boolean' })
  items: Record<number, boolean>;
}

export class PopularWishlistItemDto {
  @ApiProperty()
  product_id: number;

  @ApiProperty()
  product_name: string;

  @ApiProperty()
  product_slug: string;

  @ApiPropertyOptional()
  product_thumbnail_url: string | null;

  @ApiProperty()
  product_is_active: boolean;

  @ApiProperty()
  wishlist_count: number;
}
