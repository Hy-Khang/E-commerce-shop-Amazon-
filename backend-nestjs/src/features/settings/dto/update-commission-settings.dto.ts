import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { CommissionMode } from '../types/settings.types';

/**
 * Partial update of the commission config. Every field optional — the service
 * only writes the keys present in the body.
 */
export class UpdateCommissionSettingsDto {
  @ApiPropertyOptional({ description: 'Master on/off switch' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: CommissionMode })
  @IsOptional()
  @IsEnum(CommissionMode)
  mode?: CommissionMode;

  @ApiPropertyOptional({
    description: 'Platform-wide commission rate percent (0-100)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  rate_percent?: number;
}
