import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CategoryQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by category name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by parent category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  parent_id?: number;

  @ApiPropertyOptional({ enum: ['name', 'id'], default: 'name' })
  @IsOptional()
  @IsEnum(['name', 'id'])
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
