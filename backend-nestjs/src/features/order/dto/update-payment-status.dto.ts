import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PaymentStatus } from '../../../common/constants';

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus, description: 'New payment status' })
  @IsEnum(PaymentStatus)
  payment_status: PaymentStatus;
}
