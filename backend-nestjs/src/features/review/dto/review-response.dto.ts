import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  product_id: number;

  @ApiProperty()
  order_id: number;

  @ApiProperty()
  rating: number;

  @ApiPropertyOptional()
  comment: string | null;

  @ApiProperty()
  created_at: Date;
}

export class ReviewWithUserResponseDto extends ReviewResponseDto {
  @ApiProperty()
  user_full_name: string;

  @ApiPropertyOptional()
  variant_color?: string | null;

  @ApiPropertyOptional()
  variant_size?: string | null;
}

export class ReviewStatsDto {
  @ApiProperty()
  average_rating: number;

  @ApiProperty()
  total_reviews: number;

  @ApiProperty()
  rating_distribution: Record<number, number>;
}

export class MyReviewResponseDto extends ReviewResponseDto {
  @ApiPropertyOptional()
  product_name?: string;

  @ApiPropertyOptional()
  product_thumbnail_url?: string | null;

  @ApiPropertyOptional()
  variant_color?: string | null;

  @ApiPropertyOptional()
  variant_size?: string | null;
}

export class AdminReviewResponseDto extends ReviewResponseDto {
  @ApiProperty()
  user_id: number;

  @ApiPropertyOptional()
  user_email?: string;

  @ApiPropertyOptional()
  user_full_name?: string;

  @ApiPropertyOptional()
  product_name?: string;

  @ApiPropertyOptional()
  product_thumbnail_url?: string | null;

  @ApiPropertyOptional()
  variant_color?: string | null;

  @ApiPropertyOptional()
  variant_size?: string | null;
}
