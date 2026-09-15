import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CoinTransactionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({
    description: 'earn / redeem / expire / reverse_earn / refund',
  })
  type: string;

  @ApiProperty({ description: 'Positive magnitude; sign implied by type' })
  amount: number;

  @ApiPropertyOptional()
  order_id: number | null;

  @ApiPropertyOptional()
  note: string | null;

  @ApiProperty()
  created_at: Date;
}
