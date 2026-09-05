import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletBalanceResponseDto {
  @ApiProperty({ description: 'Withdrawable balance (VND)' })
  balance: number;
}

export class WalletTransactionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({
    enum: ['sale_earning', 'withdrawal', 'reversal', 'withdrawal_refund'],
  })
  type: string;

  @ApiProperty({ description: 'Positive magnitude; sign implied by type' })
  amount: number;

  @ApiPropertyOptional({ nullable: true })
  order_id: number | null;

  @ApiPropertyOptional({ nullable: true })
  withdrawal_id: number | null;

  @ApiPropertyOptional({ nullable: true })
  note: string | null;

  @ApiProperty()
  created_at: Date;
}
