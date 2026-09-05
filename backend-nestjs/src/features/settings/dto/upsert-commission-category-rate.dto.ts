import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpsertCommissionCategoryRateDto {
  @ApiProperty({ description: 'Commission rate percent for this category (0-100)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  rate_percent: number;
}
