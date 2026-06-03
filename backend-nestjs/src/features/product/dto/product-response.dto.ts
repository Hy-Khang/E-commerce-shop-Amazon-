import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VariantResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  sku: string;

  @ApiPropertyOptional()
  option1: string | null;

  @ApiPropertyOptional()
  option2: string | null;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  sale_price: number | null;

  @ApiProperty()
  stock_quantity: number;
}

export class ImageResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  image_url: string;

  @ApiProperty()
  sort_order: number;
}

export class ProductResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiPropertyOptional()
  thumbnail_url: string | null;

  @ApiProperty()
  is_active: boolean;

  @ApiPropertyOptional()
  option1_label: string | null;

  @ApiPropertyOptional()
  option2_label: string | null;

  @ApiProperty()
  category_id: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ type: [VariantResponseDto] })
  variants: VariantResponseDto[];

  @ApiProperty({ type: [ImageResponseDto] })
  images: ImageResponseDto[];
}

export class AdminProductDetailResponseDto extends ProductResponseDto {
  @ApiProperty()
  reviewCount: number;

  @ApiProperty()
  avgRating: number;
}
