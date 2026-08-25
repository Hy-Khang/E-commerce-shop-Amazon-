import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';
import { ShipperDashboardService } from './shipper-dashboard.service';
import { ShipperDashboardStatsResponseDto } from './dto/shipper-dashboard-stats-response.dto';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@ApiTags('Shipper: Dashboard')
@ApiBearerAuth()
@Controller('shipper/dashboard')
export class ShipperDashboardController {
  constructor(
    private readonly shipperDashboardService: ShipperDashboardService,
  ) {}

  @Get()
  @Permissions(PERMISSIONS.DASHBOARD_READ)
  @ApiOperation({ summary: 'Get shipper dashboard analytics' })
  @ApiResponse({
    status: 200,
    description: 'Shipper dashboard analytics data',
    type: ShipperDashboardStatsResponseDto,
  })
  async getShipperDashboard(
    @CurrentUser() user: ICurrentUser,
    @Query() query: DashboardQueryDto,
  ) {
    return this.shipperDashboardService.getShipperDashboard(
      user.id,
      query.period,
    );
  }
}
