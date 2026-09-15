import { Injectable } from '@nestjs/common';
import { SellerWalletRepository } from './repositories/seller-wallet.repository';
import { WalletTransactionRepository } from './repositories/wallet-transaction.repository';
import { WalletBalanceResponseDto } from './dto/wallet-response.dto';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { WalletTransactionResponseDto } from './dto/wallet-response.dto';

@Injectable()
export class SellerWalletService {
  constructor(
    private readonly walletRepo: SellerWalletRepository,
    private readonly walletTxnRepo: WalletTransactionRepository,
  ) {}

  /** My withdrawable balance (self-heals an empty wallet on first read). */
  async getBalance(userId: number): Promise<WalletBalanceResponseDto> {
    const wallet = await this.walletRepo.getOrCreate(userId);
    return { balance: Number(wallet.balance) };
  }

  async getTransactions(
    userId: number,
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<WalletTransactionResponseDto>> {
    const result = await this.walletTxnRepo.findByUserPaginated(
      userId,
      page,
      limit,
    );

    return {
      data: result.data.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        order_id: t.order_id,
        withdrawal_id: t.withdrawal_id,
        note: t.note,
        created_at: t.created_at,
      })),
      meta: result.meta,
    };
  }
}
