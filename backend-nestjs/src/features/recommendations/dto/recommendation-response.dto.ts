import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductResponseDto } from '../../product/dto/product-response.dto';

/** `GET /recommendations` — personalized "Recommended for You" set. */
export class RecommendationsResponseDto {
  @ApiPropertyOptional({
    nullable: true,
    description:
      'Human-readable reason for the suggestions (null on cold-start / fallback)',
    example: 'Because you like Electronics',
  })
  reason: string | null;

  @ApiProperty({
    type: [ProductResponseDto],
    description: 'Scored products (same shape as GET /products)',
  })
  products: ProductResponseDto[];
}

/** `GET /products/:id/similar` and `/frequently-bought-together`. */
export class ProductListResponseDto {
  @ApiProperty({
    type: [ProductResponseDto],
    description: 'Products (same shape as GET /products)',
  })
  products: ProductResponseDto[];
}
