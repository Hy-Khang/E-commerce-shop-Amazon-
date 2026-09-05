import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SellerApplication } from '../entities/seller-application.entity';

export class SellerApplicationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  user_id: number;

  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  status: string;

  @ApiProperty()
  shop_name: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional({ nullable: true })
  business_name: string | null;

  @ApiPropertyOptional({ nullable: true })
  tax_id: string | null;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  logo_url: string | null;

  @ApiPropertyOptional({ nullable: true })
  banner_url: string | null;

  @ApiPropertyOptional({ nullable: true })
  reject_reason: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewed_at: Date | null;

  @ApiProperty()
  created_at: Date;

  static fromEntity(e: SellerApplication): SellerApplicationResponseDto {
    return {
      id: e.id,
      user_id: e.user_id,
      status: e.status,
      shop_name: e.shop_name,
      phone: e.phone,
      business_name: e.business_name,
      tax_id: e.tax_id,
      description: e.description,
      logo_url: e.logo_url,
      banner_url: e.banner_url,
      reject_reason: e.reject_reason,
      reviewed_at: e.reviewed_at,
      created_at: e.created_at,
    };
  }
}
