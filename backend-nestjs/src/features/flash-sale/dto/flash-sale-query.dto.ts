import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { FlashSaleSortBy, FlashSaleStatus } from '../types/flash-sale.types';

export class FlashSaleQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by campaign name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: FlashSaleStatus })
  @IsOptional()
  @IsEnum(FlashSaleStatus)
  status?: FlashSaleStatus;

  @ApiPropertyOptional({
    description: 'Filter by active status: true or false',
  })
  @IsOptional()
  @IsString()
  is_active?: string;

  @ApiPropertyOptional({
    enum: FlashSaleSortBy,
    default: FlashSaleSortBy.CreatedAt,
  })
  @IsOptional()
  @IsEnum(FlashSaleSortBy)
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';
}
