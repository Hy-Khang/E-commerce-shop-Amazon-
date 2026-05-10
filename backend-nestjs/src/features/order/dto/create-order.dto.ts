import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { PaymentMethod } from '../../../common/constants';

export class CreateOrderDto {
  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({ description: 'Shipping address ID' })
  @IsInt()
  @IsPositive()
  address_id: number;
}
