import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

/**
 * Partial update of the coin config. Every field optional — the service only
 * writes the keys present in the body.
 */
export class UpdateCoinSettingsDto {
  @ApiPropertyOptional({ description: 'Master on/off switch' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: '% of post-discount items total earned as Xu (0-100)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  earn_rate_percent?: number;

  @ApiPropertyOptional({
    description: 'Max % of a checkout redeemable in Xu (0-100)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  redeem_max_percent?: number;

  @ApiPropertyOptional({
    description: 'Days until an earned Xu batch expires (1-3650)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  expiry_days?: number;
}
