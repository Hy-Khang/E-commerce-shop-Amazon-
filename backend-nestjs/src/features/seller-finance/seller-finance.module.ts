import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionTransaction } from './entities/commission-transaction.entity';
import { SellerWallet } from './entities/seller-wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { WithdrawalRequest } from './entities/withdrawal-request.entity';
import { CommissionTransactionRepository } from './repositories/commission-transaction.repository';
import { SellerWalletRepository } from './repositories/seller-wallet.repository';
import { WalletTransactionRepository } from './repositories/wallet-transaction.repository';
import { WithdrawalRequestRepository } from './repositories/withdrawal-request.repository';
import { CommissionService } from './commission.service';
import { SellerWalletService } from './seller-wallet.service';
import { WithdrawalService } from './withdrawal.service';
import { SellerWalletController } from './seller-wallet.controller';
import { AdminWithdrawalController } from './admin-withdrawal.controller';

/**
 * Seller finance: platform commission ledger, seller wallet, and payout
 * (withdrawal) queue. Exports `CommissionService` so the order layer can charge
 * commission synchronously on completion — this module imports NOTHING from
 * order/product (no circular dep); the order layer passes a prepared context.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommissionTransaction,
      SellerWallet,
      WalletTransaction,
      WithdrawalRequest,
    ]),
  ],
  controllers: [SellerWalletController, AdminWithdrawalController],
  providers: [
    CommissionService,
    SellerWalletService,
    WithdrawalService,
    CommissionTransactionRepository,
    SellerWalletRepository,
    WalletTransactionRepository,
    WithdrawalRequestRepository,
  ],
  exports: [CommissionService],
})
export class SellerFinanceModule {}
