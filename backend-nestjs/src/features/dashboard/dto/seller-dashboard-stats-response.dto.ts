import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RevenueDataPointDto,
  TopProductDto,
  LowStockAlertDto,
  MetricChangeDto,
} from './dashboard-stats-response.dto';

export class SellerSummaryDto {
  @ApiProperty({
    description:
      "Value of the shop's completed order items in the selected period (regardless of payment)",
  })
  grossRevenue: number;

  @ApiProperty({ type: MetricChangeDto })
  grossRevenueChange: MetricChangeDto;

  @ApiProperty({
    description: "Value of the shop's completed + paid order items in period",
  })
  collectedRevenue: number;

  @ApiProperty({ type: MetricChangeDto })
  collectedRevenueChange: MetricChangeDto;

  @ApiProperty({ description: 'Non-cancelled orders in the selected period' })
  totalOrders: number;

  @ApiProperty({ type: MetricChangeDto })
  totalOrdersChange: MetricChangeDto;

  @ApiProperty({ description: 'Active products (current snapshot)' })
  totalProducts: number;

  @ApiProperty({ description: 'Low-stock variants (current snapshot)' })
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
