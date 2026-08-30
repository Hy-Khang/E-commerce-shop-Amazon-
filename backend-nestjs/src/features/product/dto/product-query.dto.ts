import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum ProductSortBy {
  CreatedAt = 'created_at',
  Name = 'name',
  Price = 'price',
  BestSelling = 'best_selling',
  Rating = 'rating',
}

export class ProductQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by product name, description, category, or shop' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID (includes sub-categories)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  category_id?: number;

  @ApiPropertyOptional({ description: 'Filter by a set of product IDs (CSV, e.g. 1,2,3). Max 100.' })
  @IsOptional()
  @Transform(({ value }) =>
    String(value)
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isInteger(n) && n > 0),
  )
  @IsArray()
  @ArrayMaxSize(100)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  ids?: number[];

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

  @ApiPropertyOptional({ description: 'Minimum average rating (1-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  min_rating?: number;

  @ApiPropertyOptional({ description: 'Filter by shop ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  shop_id?: number;

  @ApiPropertyOptional({ description: 'Filter in-stock products only', example: 'true' })
  @IsOptional()
  @IsString()
  in_stock?: string;

  @ApiPropertyOptional({ description: 'Filter by active status (admin only)', example: 'true' })
  @IsOptional()
  @IsString()
  is_active?: string;

  @ApiPropertyOptional({ enum: ProductSortBy, default: ProductSortBy.CreatedAt })
  @IsOptional()
  @IsEnum(ProductSortBy)
  sort?: ProductSortBy;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
