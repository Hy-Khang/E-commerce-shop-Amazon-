import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { WishlistSortBy } from '../types/wishlist.types';

export class WishlistQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: WishlistSortBy,
    default: WishlistSortBy.CreatedAt,
  })
  @IsOptional()
  @IsEnum(WishlistSortBy)
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';
}
