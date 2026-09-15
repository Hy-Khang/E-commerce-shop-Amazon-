import { ApiProperty } from '@nestjs/swagger';

export class ExpiringCoinBatchDto {
  @ApiProperty({ description: 'Xu remaining in this batch' })
  amount: number;

  @ApiProperty({ description: 'When this batch expires' })
  expires_at: Date;
}

export class CoinBalanceResponseDto {
  @ApiProperty({ description: 'Total spendable Xu (active, not expired)' })
  balance: number;

  @ApiProperty({
    type: [ExpiringCoinBatchDto],
    description: 'Batches expiring within 30 days (soonest first)',
  })
  expiring_soon: ExpiringCoinBatchDto[];
}
