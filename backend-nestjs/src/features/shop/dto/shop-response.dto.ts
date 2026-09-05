import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecorationConfigDto } from './decoration-config.dto';

export class ShopResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiPropertyOptional()
  logo_url: string | null;

  @ApiPropertyOptional()
  banner_url: string | null;

  @ApiPropertyOptional({
    type: DecorationConfigDto,
    nullable: true,
    description: 'Parsed storefront decoration (null = default layout)',
  })
  decoration_config: DecorationConfigDto | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  created_at: Date;
}

export class ShopProfileResponseDto extends ShopResponseDto {
  @ApiProperty()
  product_count: number;

  @ApiProperty()
  average_rating: number;

  @ApiProperty()
  total_sales: number;
}

export class AdminShopResponseDto extends ShopResponseDto {
  @ApiProperty()
  user_id: number;

  @ApiPropertyOptional()
  verified_at: Date | null;

  @ApiPropertyOptional()
  verified_by: number | null;

  @ApiPropertyOptional()
  suspended_at: Date | null;

  @ApiPropertyOptional()
  banned_at: Date | null;

  @ApiProperty()
  updated_at: Date;
}
