import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  order_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  order_group_id?: string;
}
