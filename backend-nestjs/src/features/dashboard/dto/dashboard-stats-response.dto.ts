import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MetricChangeDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'Percent change vs previous period; null if baseline was zero',
  })
  changePercent: number | null;

  @ApiProperty({ enum: ['up', 'down', 'flat'] })
  direction: 'up' | 'down' | 'flat';
}

export class SummaryDto {
  @ApiProperty({
    description:
      'Value of completed orders in the selected period (regardless of payment)',
  })
  grossRevenue: number;

  @ApiProperty({ type: MetricChangeDto })
  grossRevenueChange: MetricChangeDto;

  @ApiProperty({
    description: 'Value of completed + paid orders in the selected period',
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

  @ApiProperty({ description: 'Active users (current snapshot)' })
  totalUsers: number;
}

export class AttentionSignalsDto {
  @ApiProperty({ description: 'Shops awaiting verification' })
  pendingShops: number;

  @ApiProperty({ description: 'Orders with an open return request' })
  returnRequestedOrders: number;
}

export class TopShopDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  orderCount: number;
}

export class RevenueDataPointDto {
  @ApiProperty({ example: '2026-06-01' })
  date: string;

  @ApiProperty()
  revenue: number;
}

export class OrderStatusCountDto {
  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty()
  count: number;
}

export class RecentOrderDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  customerName: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: 'unpaid' })
  paymentStatus: string;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  createdAt: Date;
}

export class UserRoleCountDto {
  @ApiProperty({ example: 'customer' })
  role: string;

  @ApiProperty()
  count: number;
}

export class TopProductDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  thumbnailUrl: string | null;

  @ApiProperty()
  totalOrdered: number;

  @ApiProperty()
  totalRevenue: number;
}

export class LowStockAlertDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  sku: string;

  @ApiPropertyOptional()
  option1: string | null;

  @ApiPropertyOptional()
  option2: string | null;

  @ApiProperty()
  stockQuantity: number;
}

export class DashboardStatsResponseDto {
  @ApiPropertyOptional({ type: SummaryDto })
  summary: SummaryDto | null;

  @ApiProperty({ type: [RevenueDataPointDto] })
  revenueOverTime: RevenueDataPointDto[];

  @ApiProperty({ type: [OrderStatusCountDto] })
  ordersByStatus: OrderStatusCountDto[];

  @ApiProperty({ type: [RecentOrderDto] })
  recentOrders: RecentOrderDto[];

  @ApiProperty({ type: [UserRoleCountDto] })
  usersByRole: UserRoleCountDto[];

  @ApiProperty({ type: [TopProductDto] })
  topProducts: TopProductDto[];

  @ApiProperty({ type: [LowStockAlertDto] })
  lowStockAlerts: LowStockAlertDto[];

  @ApiPropertyOptional({ type: AttentionSignalsDto })
  attentionSignals: AttentionSignalsDto | null;

  @ApiProperty({ type: [TopShopDto] })
  topShops: TopShopDto[];
}
