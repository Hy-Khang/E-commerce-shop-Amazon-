import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  thumbnailUrl: string | null;

  @ApiProperty({ description: 'Lowest effective price across variants' })
  price: number;

  @ApiPropertyOptional({
    description: 'Regular price of cheapest sale variant, for strikethrough',
  })
  originalPrice: number | null;

  @ApiPropertyOptional({ description: 'Max discount % across variants' })
  maxDiscountPercent: number | null;

  @ApiProperty()
  inStock: boolean;
}

export class TrendingProductDto extends ProductSummaryDto {
  @ApiProperty({ description: 'Wishlist count in last 30 days' })
  wishlistCount: number;
}

export class HomepageResponseDto {
  @ApiProperty({ type: [ProductSummaryDto] })
  specialOffers: ProductSummaryDto[];

  @ApiProperty({ type: [ProductSummaryDto] })
  bestSellers: ProductSummaryDto[];

  @ApiProperty({ type: [TrendingProductDto] })
  trending: TrendingProductDto[];

  @ApiProperty({ type: [ProductSummaryDto] })
  discoverMore: ProductSummaryDto[];
}
