import { ApiProperty } from '@nestjs/swagger';
import { CommissionMode } from '../types/settings.types';

export class CommissionSettingsResponseDto {
  @ApiProperty({ description: 'Master on/off switch for platform commission' })
  enabled: boolean;

  @ApiProperty({ enum: CommissionMode })
  mode: CommissionMode;

  @ApiProperty({ description: 'Platform-wide commission rate percent (0-100)' })
  rate_percent: number;
}

export class CommissionCategoryRateDto {
  @ApiProperty()
  category_id: number;

  @ApiProperty()
  rate_percent: number;
}
