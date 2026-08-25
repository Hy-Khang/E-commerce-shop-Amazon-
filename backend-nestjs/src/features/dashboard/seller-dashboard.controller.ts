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
import { SellerDashboardService } from './seller-dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { SellerDashboardStatsResponseDto } from './dto/seller-dashboard-stats-response.dto';

@ApiTags('Seller: Dashboard')
@ApiBearerAuth()
@Controller('seller/dashboard')
export class SellerDashboardController {
  constructor(
    private readonly sellerDashboardService: SellerDashboardService,
  ) {}

  @Get()
  @Permissions(PERMISSIONS.DASHBOARD_READ)
  @ApiOperation({ summary: 'Get seller dashboard analytics' })
  @ApiResponse({
    status: 200,
    description: 'Seller dashboard analytics data',
    type: SellerDashboardStatsResponseDto,
  })
  async getSellerDashboard(
    @CurrentUser() user: ICurrentUser,
    @Query() query: DashboardQueryDto,
  ) {
    return this.sellerDashboardService.getSellerDashboard(
      user.id,
      query.period,
    );
  }
}
