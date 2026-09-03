import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminUserQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by email or full_name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by role name',
    example: 'customer',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    enum: ['true', 'false'],
  })
  @IsOptional()
  @IsString()
  is_active?: string;

  @ApiPropertyOptional({
    default: 'created_at',
    enum: ['created_at', 'email', 'full_name'],
  })
  @IsOptional()
  @IsIn(['created_at', 'email', 'full_name'])
  sort?: string = 'created_at';

  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
