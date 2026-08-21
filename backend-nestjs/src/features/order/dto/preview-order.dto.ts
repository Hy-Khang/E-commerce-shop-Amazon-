import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Body for `POST /orders/preview`. Carries only the coupon codes — the cart and
 * user come from the session. Mirrors the coupon fields of `CreateOrderDto`
 * (legacy single `coupon_code` still accepted, mapped into the array).
 */
export class PreviewOrderDto {
  @ApiPropertyOptional({
    example: 'SUMMER2026',
    description: 'Single coupon code (legacy — prefer coupon_codes)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.toUpperCase().trim())
  coupon_code?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['SUMMER2026', 'MY-SHOP-SALE10'],
    description: 'Coupon codes to preview (≤1 platform + ≤1 per shop)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v: string) => v?.toUpperCase().trim())
      : value,
  )
  coupon_codes?: string[];
}
