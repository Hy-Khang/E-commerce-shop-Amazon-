import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

enum ProductSortBy {
  CreatedAt = 'created_at',
  Name = 'name',
  Price = 'price',
}

export class ProductQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by product name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  category_id?: number;

  @ApiPropertyOptional({ description: 'Minimum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_price?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number;

  @ApiPropertyOptional({ description: 'Filter by active status (admin only)', example: 'true' })
  @IsOptional()
  @IsString()
  is_active?: string;

  @ApiPropertyOptional({ enum: ProductSortBy, default: ProductSortBy.CreatedAt })
  @IsOptional()
  @IsEnum(ProductSortBy)
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
