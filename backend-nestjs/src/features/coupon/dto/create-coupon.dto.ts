import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { DiscountType, CouponScope } from '../types/coupon.types';

export class CreateCouponDto {
  @ApiProperty({ example: 'SUMMER2026' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => value.toUpperCase().trim())
  code: string;

  @ApiPropertyOptional({ example: 'Giảm 20% cho thời trang' })
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

  @ApiPropertyOptional({ enum: CouponScope, default: CouponScope.All })
  @IsOptional()
  @IsEnum(CouponScope)
  scope?: CouponScope;

  @ApiPropertyOptional({
    example: [5, 12],
    description: 'Required when scope = categories',
  })
  @ValidateIf((o) => o.scope === CouponScope.Categories)
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category must be selected' })
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  category_ids?: number[];

  @ApiPropertyOptional({
    example: [101, 102],
    description: 'Required when scope = products',
  })
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

  @ApiPropertyOptional({
    example: 100000,
    description: 'Max discount for percentage type',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  max_discount_amount?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Total usage limit (null = unlimited)',
  })
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
