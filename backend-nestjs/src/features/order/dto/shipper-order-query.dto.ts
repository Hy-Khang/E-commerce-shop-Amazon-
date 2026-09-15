import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { OrderStatus } from '../../../common/constants';

enum ShipperOrderSortBy {
  CreatedAt = 'created_at',
  TotalAmount = 'total_amount',
}

export class ShipperOrderQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: ['available', 'my_deliveries'],
    default: 'available',
    description:
      'Filter mode: available (confirmed, unassigned) or my_deliveries (assigned to this shipper)',
  })
  @IsOptional()
  @IsIn(['available', 'my_deliveries'])
  filter?: 'available' | 'my_deliveries' = 'available';

  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Further filter by status (only for my_deliveries)',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    enum: ShipperOrderSortBy,
    default: ShipperOrderSortBy.CreatedAt,
  })
  @IsOptional()
  @IsEnum(ShipperOrderSortBy)
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';
}
