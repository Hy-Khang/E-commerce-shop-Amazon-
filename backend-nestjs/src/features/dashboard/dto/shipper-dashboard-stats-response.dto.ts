import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetricChangeDto } from './dashboard-stats-response.dto';

export class ShipperSummaryDto {
  @ApiProperty({
    description:
      'Orders delivered/completed by this shipper in the selected period',
  })
  totalDelivered: number;

  @ApiProperty({ type: MetricChangeDto })
  totalDeliveredChange: MetricChangeDto;

  @ApiProperty({
    description: 'Orders currently in shipping status assigned to this shipper',
  })
  activeDeliveries: number;

  @ApiProperty({ description: 'Confirmed orders with no shipper assigned' })
  availableForPickup: number;

  @ApiProperty({ description: 'Orders delivered today by this shipper' })
  deliveredToday: number;
}

export class ShipperDeliveryDataPointDto {
  @ApiProperty({ example: '2026-07-24' })
  date: string;

  @ApiProperty()
  count: number;
}

export class ShipperRecentDeliveryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  customerName: string;

  @ApiProperty({ example: 'shipping' })
  status: string;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ description: 'Raw JSON shipping address' })
  shippingAddress: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  deliveredAt: Date | null;
}

export class ShipperDashboardStatsResponseDto {
  @ApiPropertyOptional({ type: ShipperSummaryDto })
  summary: ShipperSummaryDto | null;

  @ApiProperty({ type: [ShipperDeliveryDataPointDto] })
  deliveriesOverTime: ShipperDeliveryDataPointDto[];

  @ApiProperty({ type: [ShipperRecentDeliveryDto] })
  recentDeliveries: ShipperRecentDeliveryDto[];
}
