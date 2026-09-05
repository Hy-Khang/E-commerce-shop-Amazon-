import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SellerWalletRepository } from './repositories/seller-wallet.repository';
import { WalletTransactionRepository } from './repositories/wallet-transaction.repository';
import {
  IWithdrawalFilter,
  WithdrawalRequestRepository,
} from './repositories/withdrawal-request.repository';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalRequest } from './entities/withdrawal-request.entity';
import {
  WalletTransactionType,
  WithdrawalStatus,
} from './types/seller-finance.types';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name);

  constructor(
    private readonly withdrawalRepo: WithdrawalRequestRepository,
    private readonly walletRepo: SellerWalletRepository,
    private readonly walletTxnRepo: WalletTransactionRepository,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Seller ───

  /**
   * Create a payout request, holding the amount immediately (atomic wallet
   * debit). The withdrawal row, the debit, and the ledger entry are one
   * transaction; insufficient funds → WALLET_002.
   */
  async requestWithdrawal(
    userId: number,
    dto: CreateWithdrawalDto,
  ): Promise<WithdrawalRequest> {
    return this.dataSource.transaction(async (manager) => {
      const ok = await this.walletRepo.debitIfSufficient(
        userId,
        dto.amount,
        manager,
      );
      if (!ok) {
        throw new BadRequestException({
          code: 'WALLET_002',
          message: 'Insufficient wallet balance',
        });
      }

      const request = await this.withdrawalRepo.create(
        {
          user_id: userId,
          amount: dto.amount,
          status: WithdrawalStatus.Pending,
          bank_name: dto.bank_name,
          bank_account_number: dto.bank_account_number,
          bank_account_holder: dto.bank_account_holder,
        },
        manager,
      );

      await this.walletTxnRepo.create(
        {
          user_id: userId,
          type: WalletTransactionType.Withdrawal,
          amount: dto.amount,
          withdrawal_id: request.id,
          note: `Withdrawal request #${request.id} (held)`,
        },
        manager,
      );

      this.logger.log(
        `Withdrawal #${request.id} requested by user ${userId}: ${dto.amount}`,
      );
      return request;
    });
  }

  async listMine(
    userId: number,
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<WithdrawalRequest>> {
    return this.withdrawalRepo.findPaginated({ userId, page, limit });
  }

  // ─── Admin ───

  async listForAdmin(
    filter: IWithdrawalFilter,
  ): Promise<IPaginatedResult<WithdrawalRequest>> {
    return this.withdrawalRepo.findPaginated(filter);
  }

  private async getPending(id: number): Promise<WithdrawalRequest> {
    const request = await this.withdrawalRepo.findById(id);
    if (!request) {
      throw new NotFoundException({
        code: 'WALLET_001',
        message: 'Withdrawal request not found',
      });
    }
    if (request.status !== WithdrawalStatus.Pending) {
      throw new BadRequestException({
        code: 'WALLET_003',
        message: 'Only pending withdrawals can be reviewed',
      });
    }
    return request;
  }

  /** Approve — funds are paid out-of-band; the hold simply becomes final. */
  async approve(id: number, adminId: number): Promise<WithdrawalRequest> {
    const request = await this.getPending(id);
    await this.withdrawalRepo.update(id, {
      status: WithdrawalStatus.Approved,
      reviewed_by: adminId,
      reviewed_at: new Date(),
    });
    this.logger.log(`Withdrawal #${id} approved by admin ${adminId}`);
    return (await this.withdrawalRepo.findById(id))!;
  }

  /** Reject — refund the held amount back to the wallet. */
  async reject(
    id: number,
    adminId: number,
    rejectReason?: string,
  ): Promise<WithdrawalRequest> {
    const request = await this.getPending(id);

    await this.dataSource.transaction(async (manager) => {
      await this.walletRepo.credit(request.user_id, Number(request.amount), manager);
      await this.walletTxnRepo.create(
        {
          user_id: request.user_id,
          type: WalletTransactionType.WithdrawalRefund,
          amount: Number(request.amount),
          withdrawal_id: request.id,
          note: `Refund for rejected withdrawal #${request.id}`,
        },
        manager,
      );
      await this.withdrawalRepo.update(
        id,
        {
          status: WithdrawalStatus.Rejected,
          reject_reason: rejectReason ?? null,
          reviewed_by: adminId,
          reviewed_at: new Date(),
        },
        manager,
      );
    });

    this.logger.log(`Withdrawal #${id} rejected by admin ${adminId} (refunded)`);
    return (await this.withdrawalRepo.findById(id))!;
  }
}
