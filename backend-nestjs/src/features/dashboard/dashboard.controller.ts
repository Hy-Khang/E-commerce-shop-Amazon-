import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { DashboardService } from './dashboard.service';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';

@ApiTags('Admin: Dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Permissions(PERMISSIONS.DASHBOARD_READ)
  @ApiOperation({ summary: 'Get dashboard analytics summary' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard analytics data',
    type: DashboardStatsResponseDto,
  })
  async getDashboard() {
    return this.dashboardService.getDashboard();
  }
}
