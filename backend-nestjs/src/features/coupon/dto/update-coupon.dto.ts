import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { DiscountType, CouponScope } from '../types/coupon.types';

export class UpdateCouponDto {
  @ApiPropertyOptional({ example: 'Giảm 20% cho thời trang' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  discount_type?: DiscountType;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  discount_value?: number;

  @ApiPropertyOptional({ enum: CouponScope })
  @IsOptional()
  @IsEnum(CouponScope)
  scope?: CouponScope;

  @ApiPropertyOptional({ example: [5, 12] })
  @ValidateIf((o) => o.scope === CouponScope.Categories)
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category must be selected' })
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  category_ids?: number[];

  @ApiPropertyOptional({ example: [101, 102] })
  @ValidateIf((o) => o.scope === CouponScope.Products)
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one product must be selected' })
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  product_ids?: number[];

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  min_order_amount?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  max_discount_amount?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  max_uses?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  max_uses_per_user?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  starts_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expires_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
