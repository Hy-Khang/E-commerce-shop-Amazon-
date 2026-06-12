import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { NotificationContext } from '../types/notification.types';

export class NotificationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_read?: boolean;

  @ApiPropertyOptional({
    description: 'Portal context filter',
    enum: NotificationContext,
  })
  @IsOptional()
  @IsEnum(NotificationContext)
  context?: NotificationContext;
}
