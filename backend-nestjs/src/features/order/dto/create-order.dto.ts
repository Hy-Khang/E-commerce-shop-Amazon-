import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { PaymentMethod } from '../../../common/constants';

export class CreateOrderDto {
  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({ description: 'Shipping address ID' })
  @IsInt()
  @IsPositive()
  address_id: number;

  @ApiPropertyOptional({ example: 'SUMMER2026', description: 'Coupon code to apply' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.toUpperCase().trim())
  coupon_code?: string;
}
