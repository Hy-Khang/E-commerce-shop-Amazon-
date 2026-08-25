import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  DASHBOARD_PERIODS,
  DEFAULT_DASHBOARD_PERIOD,
  type DashboardPeriod,
} from '../utils/period.util';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    enum: DASHBOARD_PERIODS,
    default: DEFAULT_DASHBOARD_PERIOD,
    description: 'Time window for revenue trend + summary comparison',
  })
  @IsOptional()
  @IsIn(DASHBOARD_PERIODS)
  period?: DashboardPeriod;
}
