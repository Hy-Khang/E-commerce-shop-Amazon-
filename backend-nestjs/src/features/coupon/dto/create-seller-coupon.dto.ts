import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { DiscountType, CouponScope } from '../types/coupon.types';

/**
 * Seller-facing create DTO. Differs from the admin CreateCouponDto:
 * - scope limited to `all` | `products` (no `categories` for shop coupons)
 * - no `shop_id` (resolved from the seller's own shop)
 * - `code` is short (server prepends the shop slug → final code ≤ 50 chars)
 */
export class CreateSellerCouponDto {
  @ApiProperty({ example: 'SALE10', description: 'Short code; the shop slug is prepended automatically' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
  code: string;

  @ApiPropertyOptional({ example: 'Giảm 10% cho shop' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  discount_type: DiscountType;

  @ApiProperty({ example: 50000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  discount_value: number;

  @ApiPropertyOptional({
    enum: [CouponScope.All, CouponScope.Products],
    default: CouponScope.All,
    description: 'Shop coupons support `all` (whole shop) or `products` only',
  })
  @IsOptional()
  @IsIn([CouponScope.All, CouponScope.Products])
  scope?: CouponScope;

  @ApiPropertyOptional({ example: [101, 102], description: 'Required when scope = products (must belong to your shop)' })
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

  @ApiPropertyOptional({ example: 100000, description: 'Max discount for percentage type' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  max_discount_amount?: number;

  @ApiPropertyOptional({ example: 100, description: 'Total usage limit (null = unlimited)' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  max_uses?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  max_uses_per_user?: number;

  @ApiProperty({ example: '2026-06-01T00:00:00Z' })
  @IsDateString()
  starts_at: string;

  @ApiProperty({ example: '2026-06-30T23:59:59Z' })
  @IsDateString()
  expires_at: string;
}
