import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StatusHistoryEntryDto {
  @ApiProperty({ example: 'pending', nullable: true })
  fromStatus: string | null;

  @ApiProperty({ example: 'confirmed' })
  toStatus: string;

  @ApiProperty({ example: 1, nullable: true })
  actorId: number | null;

  @ApiProperty({ example: 'SELLER' })
  actorType: string;

  @ApiProperty({ example: 'Nguyen Van A', nullable: true })
  actorName: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  note: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class ShipperLocationDto {
  @ApiProperty({ example: 10.762622 })
  latitude: number;

  @ApiProperty({ example: 106.660172 })
  longitude: number;

  @ApiProperty()
  createdAt: Date;
}

export class DeliveryLocationDto {
  @ApiProperty({ example: 10.775 })
  latitude: number;

  @ApiProperty({ example: 106.695 })
  longitude: number;

  @ApiProperty({ example: '123 Le Loi, Quan 1, Ho Chi Minh' })
  label: string;
}

export class OrderTrackingResponseDto {
  @ApiProperty({ type: [StatusHistoryEntryDto] })
  timeline: StatusHistoryEntryDto[];

  @ApiPropertyOptional({ type: ShipperLocationDto, nullable: true })
  shipperLocation: ShipperLocationDto | null;

  @ApiPropertyOptional({ type: DeliveryLocationDto, nullable: true })
  deliveryLocation: DeliveryLocationDto | null;
}
