import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { FlashSaleItemStatus } from '../types/flash-sale.types';

/** Filters for the admin moderation queue and the seller "my registrations" list. */
export class FlashRegistrationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: FlashSaleItemStatus })
  @IsOptional()
  @IsEnum(FlashSaleItemStatus)
  status?: FlashSaleItemStatus;
}
