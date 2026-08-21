import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { DiscountType, CouponScope } from '../types/coupon.types';

/**
 * Seller-facing update DTO. `code` is immutable (keeps its slug prefix) and
 * `shop_id` cannot be changed. scope limited to `all` | `products`.
 */
export class UpdateSellerCouponDto {
  @ApiPropertyOptional({ example: 'Giảm 10% cho shop' })
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

  @ApiPropertyOptional({ enum: [CouponScope.All, CouponScope.Products] })
  @IsOptional()
  @IsIn([CouponScope.All, CouponScope.Products])
  scope?: CouponScope;

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
