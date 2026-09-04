import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Admin decision payload when rejecting a registration. */
export class ReviewFlashSaleItemDto {
  @ApiPropertyOptional({
    example: 'Giá chưa đủ hấp dẫn',
    description: 'Reason shown to the seller on rejection',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
