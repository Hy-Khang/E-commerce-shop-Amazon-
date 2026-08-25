import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { OrderStatus, PaymentStatus } from '../../../common/constants';

enum OrderSortBy {
  CreatedAt = 'created_at',
  TotalAmount = 'total_amount',
}

export class OrderQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: OrderStatus, description: 'Filter by order status' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Filter by payment status' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Filter by user ID (admin only)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  user_id?: number;

  @ApiPropertyOptional({
    description:
      'Free-text search (admin only) — matches order id, customer name/email, or shop name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: OrderSortBy, default: OrderSortBy.CreatedAt })
  @IsOptional()
  @IsEnum(OrderSortBy)
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';
}
