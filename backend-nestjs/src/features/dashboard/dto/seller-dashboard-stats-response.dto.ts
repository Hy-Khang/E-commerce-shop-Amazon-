import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RevenueDataPointDto,
  TopProductDto,
  LowStockAlertDto,
} from './dashboard-stats-response.dto';

export class SellerSummaryDto {
  @ApiProperty({ description: 'Total value of completed orders (regardless of payment)' })
  grossRevenue: number;

  @ApiProperty({ description: 'Total value of completed + paid orders' })
  collectedRevenue: number;

  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  totalProducts: number;

  @ApiProperty()
  lowStockCount: number;
}

export class SellerRecentOrderDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  customerName: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: 'unpaid' })
  paymentStatus: string;

  @ApiProperty()
  sellerSubtotal: number;

  @ApiProperty()
  createdAt: Date;
}

export class SellerDashboardStatsResponseDto {
  @ApiPropertyOptional({ type: SellerSummaryDto })
  summary: SellerSummaryDto | null;

  @ApiProperty({ type: [RevenueDataPointDto] })
  revenueOverTime: RevenueDataPointDto[];

  @ApiProperty({ type: [TopProductDto] })
  topProducts: TopProductDto[];

  @ApiProperty({ type: [SellerRecentOrderDto] })
  recentOrders: SellerRecentOrderDto[];

  @ApiProperty({ type: [LowStockAlertDto] })
  lowStockAlerts: LowStockAlertDto[];
}
