import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CouponScope, CouponSortBy, DiscountType } from '../types/coupon.types';

export class CouponQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['platform', 'shop'],
    description: 'Filter by ownership: platform (shop_id NULL) or shop (any shop coupon)',
  })
  @IsOptional()
  @IsIn(['platform', 'shop'])
  owner?: 'platform' | 'shop';

  @ApiPropertyOptional({ description: 'Filter by owning shop id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  shop_id?: number;

  @ApiPropertyOptional({ enum: CouponScope })
  @IsOptional()
  @IsEnum(CouponScope)
  scope?: CouponScope;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  discount_type?: DiscountType;

  @ApiPropertyOptional({ description: 'Filter by active status: true or false' })
  @IsOptional()
  @IsString()
  is_active?: string;

  @ApiPropertyOptional({ enum: CouponSortBy, default: CouponSortBy.CreatedAt })
  @IsOptional()
  @IsEnum(CouponSortBy)
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';
}

export class CouponUsageQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by coupon ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  coupon_id?: number;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  user_id?: number;
}
