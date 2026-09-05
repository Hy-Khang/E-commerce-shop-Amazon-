import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommissionTransactionRepository } from './repositories/commission-transaction.repository';
import { SellerWalletRepository } from './repositories/seller-wallet.repository';
import { WalletTransactionRepository } from './repositories/wallet-transaction.repository';
import {
  CommissionTransactionType,
  OrderCommissionContext,
  WalletTransactionType,
} from './types/seller-finance.types';
import { commissionBase, computeCommission } from './utils/commission.util';
import type { CommissionConfig } from '../settings/types/settings.types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    private readonly commissionTxnRepo: CommissionTransactionRepository,
    private readonly walletRepo: SellerWalletRepository,
    private readonly walletTxnRepo: WalletTransactionRepository,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Charge the platform commission for a completed order and credit the seller's
   * wallet with the net (gross − commission). Idempotent per order (guarded by an
   * existing `charge` txn). No-op when the feature is disabled or the net base is
   * ≤ 0. The commission ledger row, wallet credit, and wallet ledger row are
   * written in one transaction.
   */
  async chargeForOrder(
    ctx: OrderCommissionContext,
    config: CommissionConfig,
    categoryRates: Map<number, number>,
  ): Promise<void> {
    if (!config.enabled) return;

    const already = await this.commissionTxnRepo.existsByOrderAndType(
      ctx.order_id,
      CommissionTransactionType.Charge,
    );
    if (already) return;

    // Single source of truth for the base — shared with computeCommission so the
    // ledger's base_amount, the wallet net, and the effective rate can't diverge.
    const gross = commissionBase(ctx);
    if (gross <= 0) return;

    const commission = computeCommission(ctx, config, categoryRates);
    const net = round2(gross - commission);
    const effectiveRate = gross > 0 ? round2((commission / gross) * 100) : 0;

    await this.dataSource.transaction(async (manager) => {
      await this.commissionTxnRepo.create(
        {
          shop_id: ctx.shop_id,
          user_id: ctx.seller_user_id,
          order_id: ctx.order_id,
          base_amount: gross,
          rate_percent: effectiveRate,
          commission_amount: commission,
          type: CommissionTransactionType.Charge,
          note: `Commission on order #${ctx.order_id}`,
        },
        manager,
      );

      await this.walletRepo.credit(ctx.seller_user_id, net, manager);

      await this.walletTxnRepo.create(
        {
          user_id: ctx.seller_user_id,
          type: WalletTransactionType.SaleEarning,
          amount: net,
          order_id: ctx.order_id,
          note: `Sale earning from order #${ctx.order_id}`,
        },
        manager,
      );
    });

    this.logger.log(
      `Commission charged: order=${ctx.order_id}, shop=${ctx.shop_id}, ` +
        `gross=${gross}, commission=${commission}, net=${net}`,
    );
  }

  // ─── Reporting (dashboards) ───

  /**
   * Commissionable base + commission (both charge − reverse) for a shop within
   * [from, to). The seller dashboard derives `netRevenue = base − commission`
   * from this so net and commission share one base. `commissionTotal` is
   * `commission`.
   */
  async getShopCommissionBreakdown(
    shopId: number,
    from: Date,
    to: Date,
  ): Promise<{ base: number; commission: number }> {
    return this.commissionTxnRepo.sumBreakdownForShop(shopId, from, to);
  }

  /** Net commission (charge − reverse) platform-wide within [from, to). */
  async getPlatformCommissionNet(from: Date, to: Date): Promise<number> {
    return this.commissionTxnRepo.sumNetAllShops(from, to);
  }

  /**
   * Reverse a previously-charged order (defensive/idempotent — rarely fires
   * because `completed` orders are not cancellable). Writes a `reverse` ledger
   * row and debits the net back out of the wallet, allowing a controlled
   * negative balance (debt). No-op if the order was never charged.
   */
  async reverseForOrder(orderId: number): Promise<void> {
    const already = await this.commissionTxnRepo.existsByOrderAndType(
      orderId,
      CommissionTransactionType.Reverse,
    );
    if (already) return;

    const charge = await this.commissionTxnRepo.findByOrderAndType(
      orderId,
      CommissionTransactionType.Charge,
    );
    if (!charge) return;

    const gross = Number(charge.base_amount);
    const commission = Number(charge.commission_amount);
    const net = round2(gross - commission);

    await this.dataSource.transaction(async (manager) => {
      await this.commissionTxnRepo.create(
        {
          shop_id: charge.shop_id,
          user_id: charge.user_id,
          order_id: orderId,
          base_amount: gross,
          rate_percent: Number(charge.rate_percent),
          commission_amount: commission,
          type: CommissionTransactionType.Reverse,
          note: `Reversed commission on cancelled order #${orderId}`,
        },
        manager,
      );

      await this.walletRepo.debitAllowNegative(charge.user_id, net, manager);

      await this.walletTxnRepo.create(
        {
          user_id: charge.user_id,
          type: WalletTransactionType.Reversal,
          amount: net,
          order_id: orderId,
          note: `Reversed sale earning from cancelled order #${orderId}`,
        },
        manager,
      );
    });

    this.logger.log(
      `Commission reversed: order=${orderId}, shop=${charge.shop_id}, net=${net}`,
    );
  }
}
