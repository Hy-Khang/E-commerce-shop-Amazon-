import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '../../../common/constants';

export class CreateOrderDto {
  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({ description: 'Shipping address ID' })
  @IsInt()
  @IsPositive()
  address_id: number;

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
    description: 'Coupon codes to apply (≤1 platform + ≤1 per shop)',
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
