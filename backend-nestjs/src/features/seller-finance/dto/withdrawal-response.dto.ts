import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WithdrawalRequest } from '../entities/withdrawal-request.entity';

export class WithdrawalResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  user_id: number;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  status: string;

  @ApiProperty()
  bank_name: string;

  @ApiProperty()
  bank_account_number: string;

  @ApiProperty()
  bank_account_holder: string;

  @ApiPropertyOptional({ nullable: true })
  reject_reason: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewed_at: Date | null;

  @ApiProperty()
  created_at: Date;

  static fromEntity(e: WithdrawalRequest): WithdrawalResponseDto {
    return {
      id: e.id,
      user_id: e.user_id,
      amount: Number(e.amount),
      status: e.status,
      bank_name: e.bank_name,
      bank_account_number: e.bank_account_number,
      bank_account_holder: e.bank_account_holder,
      reject_reason: e.reject_reason,
      reviewed_at: e.reviewed_at,
      created_at: e.created_at,
    };
  }
}
