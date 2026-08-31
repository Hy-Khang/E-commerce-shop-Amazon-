import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CoinBatchRepository } from './repositories/coin-batch.repository';
import { CoinTransactionRepository } from './repositories/coin-transaction.repository';
import {
  CoinBalanceResponseDto,
} from './dto/coin-balance-response.dto';
import { CoinTransactionResponseDto } from './dto/coin-transaction-response.dto';
import {
  CoinBatchStatus,
  CoinTransactionType,
} from './types/coin.types';
import {
  computeEarnAmount,
  computeExpiryDate,
  computeRedeemCap,
} from './utils/coin.util';
import type { CoinConfig } from '../settings/types/settings.types';
import type { Order } from '../order/entities/order.entity';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';

const EXPIRING_SOON_DAYS = 30;

/** The minimal order shape the coin lifecycle reads — lets a lightweight
 * scheduler projection award Xu without loading the full entity. */
type OrderEarnContext = Pick<
  Order,
  'id' | 'user_id' | 'total_amount' | 'shipping_fee'
>;
type OrderReverseContext = Pick<Order, 'id' | 'user_id'>;
type OrderRefundContext = Pick<Order, 'id' | 'user_id' | 'coin_discount'>;

@Injectable()
export class CoinService {
  private readonly logger = new Logger(CoinService.name);

  constructor(
    private readonly coinBatchRepository: CoinBatchRepository,
    private readonly coinTransactionRepository: CoinTransactionRepository,
  ) {}

  // ─── Customer reads ───

  async getBalance(userId: number): Promise<CoinBalanceResponseDto> {
    const [balance, expiring] = await Promise.all([
      this.coinBatchRepository.getActiveBalance(userId),
      this.coinBatchRepository.findExpiringSoon(userId, EXPIRING_SOON_DAYS),
    ]);

    return {
      balance,
      expiring_soon: expiring.map((b) => ({
        amount: b.amount_remaining,
        expires_at: b.expires_at,
      })),
    };
  }

  async getTransactions(
    userId: number,
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<CoinTransactionResponseDto>> {
    const result = await this.coinTransactionRepository.findByUserPaginated(
      userId,
      page,
      limit,
    );

    return {
      data: result.data.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        order_id: t.order_id,
        note: t.note,
        created_at: t.created_at,
      })),
      meta: result.meta,
    };
  }

  // ─── Redemption (checkout) ───

  /**
   * Resolve how much Xu a checkout may actually redeem: `min(requested, cap,
   * balance)`, integer, ≥ 0. **Clamps rather than throws** for the cap and the
   * balance — the client's requested amount is a best-effort estimate (its cap
   * is computed without flash prices / exact multi-coupon allocation), so a
   * slight over-request must not block the whole checkout. The caller then
   * distributes and consumes exactly this amount, and the preview echoes it as
   * `coins_applied`. Returns 0 when the feature is off (a mid-session admin
   * toggle then silently ignores redemption instead of erroring checkout).
   * COIN_003 is still a hard error for a non-integer request (defensive — the
   * DTO already enforces `@IsInt`); the genuine race is caught in
   * `redeemForCheckout` (COIN_001).
   */
  async validateRedemption(
    userId: number,
    coinsToRedeem: number,
    itemsTotalAfterCoupon: number,
    config: CoinConfig,
  ): Promise<number> {
    if (!coinsToRedeem || coinsToRedeem <= 0) return 0;

    if (!Number.isInteger(coinsToRedeem)) {
      throw new BadRequestException({
        code: 'COIN_003',
        message: 'Coin amount must be a positive integer',
      });
    }

    if (!config.enabled) return 0;

    const cap = computeRedeemCap(
      itemsTotalAfterCoupon,
      config.redeem_max_percent,
    );
    const balance = await this.coinBatchRepository.getActiveBalance(userId);

    return Math.max(0, Math.min(coinsToRedeem, cap, balance));
  }

  /**
   * Consume `amount` Xu FIFO (soonest-to-expire first) inside the checkout
   * transaction, writing one `redeem` ledger entry. Atomic per-batch guards
   * prevent over-consumption under concurrency. Throws COIN_001 if the balance
   * changed between validation and consumption. No-op for amount ≤ 0.
   */
  async redeemForCheckout(
    userId: number,
    amount: number,
    orderId: number | null,
    orderGroupId: string,
    manager: EntityManager,
  ): Promise<number> {
    if (amount <= 0) return 0;

    const batches = await this.coinBatchRepository.findConsumableBatches(
      userId,
      manager,
    );

    let remaining = amount;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, batch.amount_remaining);
      const ok = await this.coinBatchRepository.consume(batch.id, take, manager);
      if (ok) remaining -= take;
    }

    if (remaining > 0) {
      // Balance shrank since validation (concurrent checkout / expiry).
      throw new BadRequestException({
        code: 'COIN_001',
        message: 'Insufficient coin balance',
      });
    }

    await this.coinTransactionRepository.create(
      {
        user_id: userId,
        type: CoinTransactionType.Redeem,
        amount,
        order_id: orderId,
        batch_id: null,
        note: `Redeemed at checkout (group ${orderGroupId})`,
      },
      manager,
    );

    this.logger.log(
      `Coin redeem: user=${userId}, amount=${amount}, group=${orderGroupId}`,
    );
    return amount;
  }

  // ─── Earn / reverse / refund (order lifecycle, best-effort) ───

  /**
   * Award Xu when an order reaches `completed`. Idempotent per order (guarded by
   * an existing `earn` txn). Earn base = post-discount items total excluding
   * shipping and any Xu-paid portion — which equals `total_amount − shipping_fee`
   * (total already nets out coupon discount and coin discount).
   */
  async awardForOrder(order: OrderEarnContext, config: CoinConfig): Promise<void> {
    if (!config.enabled) return;

    const already = await this.coinTransactionRepository.existsByOrderAndType(
      order.id,
      CoinTransactionType.Earn,
    );
    if (already) return;

    const base = Number(order.total_amount) - Number(order.shipping_fee);
    const earn = computeEarnAmount(base, config.earn_rate_percent);
    if (earn <= 0) return;

    const batch = await this.coinBatchRepository.createBatch({
      user_id: order.user_id,
      source_order_id: order.id,
      amount_earned: earn,
      amount_remaining: earn,
      expires_at: computeExpiryDate(config.expiry_days),
      status: CoinBatchStatus.Active,
    });

    await this.coinTransactionRepository.create({
      user_id: order.user_id,
      type: CoinTransactionType.Earn,
      amount: earn,
      order_id: order.id,
      batch_id: batch.id,
      note: `Earned from order #${order.id}`,
    });

    this.logger.log(
      `Coin earn: user=${order.user_id}, order=${order.id}, amount=${earn}`,
    );
  }

  /**
   * Reverse the earn batch of a cancelled order — removes only the still-unspent
   * remainder (never forces the balance negative if the user already spent some).
   * Idempotent per order.
   */
  async reverseEarnForOrder(order: OrderReverseContext): Promise<void> {
    const already = await this.coinTransactionRepository.existsByOrderAndType(
      order.id,
      CoinTransactionType.ReverseEarn,
    );
    if (already) return;

    const batch = await this.coinBatchRepository.findEarnBatchByOrderId(
      order.id,
    );
    if (!batch) return;

    const removed = await this.coinBatchRepository.reverseEarnBatch(batch.id);
    if (removed <= 0) return;

    await this.coinTransactionRepository.create({
      user_id: order.user_id,
      type: CoinTransactionType.ReverseEarn,
      amount: removed,
      order_id: order.id,
      batch_id: batch.id,
      note: `Reversed earn from cancelled order #${order.id}`,
    });

    this.logger.log(
      `Coin reverse-earn: user=${order.user_id}, order=${order.id}, amount=${removed}`,
    );
  }

  /**
   * Refund Xu spent on a cancelled order as a fresh batch (reset expiry).
   * `source_order_id` stays NULL so it is never mistaken for an earn batch.
   * Idempotent per order.
   */
  async refundRedemptionForOrder(
    order: OrderRefundContext,
    config: CoinConfig,
  ): Promise<void> {
    const coinDiscount = Number(order.coin_discount ?? 0);
    if (coinDiscount <= 0) return;

    const already = await this.coinTransactionRepository.existsByOrderAndType(
      order.id,
      CoinTransactionType.Refund,
    );
    if (already) return;

    const amount = Math.round(coinDiscount);
    const batch = await this.coinBatchRepository.createBatch({
      user_id: order.user_id,
      source_order_id: null,
      amount_earned: amount,
      amount_remaining: amount,
      expires_at: computeExpiryDate(config.expiry_days),
      status: CoinBatchStatus.Active,
    });

    await this.coinTransactionRepository.create({
      user_id: order.user_id,
      type: CoinTransactionType.Refund,
      amount,
      order_id: order.id,
      batch_id: batch.id,
      note: `Refunded Coins from cancelled order #${order.id}`,
    });

    this.logger.log(
      `Coin refund: user=${order.user_id}, order=${order.id}, amount=${amount}`,
    );
  }

  // ─── Expiry cron ───

  async expireBatches(): Promise<number> {
    const batches = await this.coinBatchRepository.findExpiredActiveBatches();
    for (const batch of batches) {
      await this.coinBatchRepository.markExpired(batch.id);
      await this.coinTransactionRepository.create({
        user_id: batch.user_id,
        type: CoinTransactionType.Expire,
        amount: batch.amount_remaining,
        order_id: null,
        batch_id: batch.id,
        note: `Expired batch #${batch.id}`,
      });
    }
    return batches.length;
  }
}
