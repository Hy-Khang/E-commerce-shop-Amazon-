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
}
