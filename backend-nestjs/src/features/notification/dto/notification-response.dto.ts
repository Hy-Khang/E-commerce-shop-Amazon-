import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional({ nullable: true })
  data: Record<string, unknown> | null;

  @ApiProperty()
  is_read: boolean;

  @ApiProperty()
  created_at: Date;
}

export class UnreadCountResponseDto {
  @ApiProperty()
  count: number;
}
