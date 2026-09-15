import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import {
  ActivityAction,
  ActivityTargetType,
} from '../types/recommendations.types';

/**
 * Body for `POST /activity`. Deliberately lenient — only the enums are
 * validated; a stale/unknown `target_id` is tolerated (analytics signal,
 * never blocks UX).
 */
export class RecordActivityDto {
  @ApiProperty({ enum: ActivityAction, description: 'Behavioral action' })
  @IsEnum(ActivityAction)
  action: ActivityAction;

  @ApiProperty({ enum: ActivityTargetType, description: 'What target_id refers to' })
  @IsEnum(ActivityTargetType)
  target_type: ActivityTargetType;

  @ApiPropertyOptional({
    description: 'Product/category id (omit for SEARCH)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  target_id?: number;

  @ApiPropertyOptional({
    description: 'Free-form JSON hints, e.g. { keyword } for SEARCH',
  })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
