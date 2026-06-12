import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SummaryDto {
  @ApiProperty({ description: 'Total value of completed orders (regardless of payment)' })
  grossRevenue: number;

  @ApiProperty({ description: 'Total value of completed + paid orders' })
  collectedRevenue: number;

  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  totalProducts: number;

  @ApiProperty()
  totalUsers: number;
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
}
