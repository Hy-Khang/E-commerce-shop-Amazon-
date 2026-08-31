import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CoinBatch } from '../entities/coin-batch.entity';
import { CoinBatchStatus } from '../types/coin.types';

@Injectable()
export class CoinBatchRepository {
  constructor(
    @InjectRepository(CoinBatch)
    private readonly repo: Repository<CoinBatch>,
  ) {}

  /** Balance = Σ amount_remaining of active, not-yet-expired batches. */
  async getActiveBalance(userId: number): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.amount_remaining), 0)', 'balance')
      .where('b.user_id = :userId', { userId })
      .andWhere('b.status = :status', { status: CoinBatchStatus.Active })
      .andWhere('b.expires_at > SYSUTCDATETIME()')
      .getRawOne<{ balance: string }>();

    return parseInt(result?.balance ?? '0', 10);
  }

  /** Active, unexpired batches expiring within `days` days (soonest first). */
  async findExpiringSoon(userId: number, days: number): Promise<CoinBatch[]> {
    return this.repo
      .createQueryBuilder('b')
      .where('b.user_id = :userId', { userId })
      .andWhere('b.status = :status', { status: CoinBatchStatus.Active })
      .andWhere('b.amount_remaining > 0')
      .andWhere('b.expires_at > SYSUTCDATETIME()')
      .andWhere('b.expires_at <= DATEADD(day, :days, SYSUTCDATETIME())', {
        days,
      })
      .orderBy('b.expires_at', 'ASC')
      .getMany();
  }

  /**
   * FIFO consumption order: active, unexpired batches with remaining Xu, oldest
   * (soonest to expire) first. Fetched inside the checkout transaction.
   */
  async findConsumableBatches(
    userId: number,
    manager: EntityManager,
  ): Promise<CoinBatch[]> {
    return manager
      .createQueryBuilder(CoinBatch, 'b')
      .where('b.user_id = :userId', { userId })
      .andWhere('b.status = :status', { status: CoinBatchStatus.Active })
      .andWhere('b.amount_remaining > 0')
      .andWhere('b.expires_at > SYSUTCDATETIME()')
      .orderBy('b.expires_at', 'ASC')
      .addOrderBy('b.id', 'ASC')
      .getMany();
  }

  /**
   * Atomically debit a batch. Guard clause prevents over-consumption under
   * concurrency. Flips to `depleted` when it hits zero. Returns true on success.
   */
  async consume(
    batchId: number,
    amount: number,
    manager: EntityManager,
  ): Promise<boolean> {
    // `amount` is a server-computed, validated integer — safe to inline into the
    // SQL fragments (avoids re-binding the same param across two set clauses).
    const n = Math.trunc(amount);
    const result = await manager
      .createQueryBuilder()
      .update(CoinBatch)
      .set({
        amount_remaining: () => `amount_remaining - ${n}`,
        status: () =>
          `CASE WHEN amount_remaining - ${n} = 0 THEN '${CoinBatchStatus.Depleted}' ELSE status END`,
      })
      .where('id = :id', { id: batchId })
      .andWhere('amount_remaining >= :n', { n })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  async createBatch(
    data: Partial<CoinBatch>,
    manager?: EntityManager,
  ): Promise<CoinBatch> {
    if (manager) {
      return manager.save(manager.create(CoinBatch, data));
    }
    return this.repo.save(this.repo.create(data));
  }

  /** Cron: active batches whose expiry has passed but still hold Xu. */
  async findExpiredActiveBatches(): Promise<CoinBatch[]> {
    return this.repo
      .createQueryBuilder('b')
      .where('b.status = :status', { status: CoinBatchStatus.Active })
      .andWhere('b.expires_at <= SYSUTCDATETIME()')
      .andWhere('b.amount_remaining > 0')
      .getMany();
  }

  async markExpired(batchId: number): Promise<void> {
    await this.repo.update(batchId, { status: CoinBatchStatus.Expired });
  }

  /** The earn batch produced by an order (idempotency + reversal lookup). */
  async findEarnBatchByOrderId(orderId: number): Promise<CoinBatch | null> {
    return this.repo.findOne({ where: { source_order_id: orderId } });
  }

  /**
   * Reverse an earn batch: mark `reversed` and zero its remaining balance, but
   * only debit the still-unspent portion. Returns the amount actually removed
   * (may be < amount_earned if the user already spent some). Idempotent — a
   * batch already `reversed` returns 0.
   */
  async reverseEarnBatch(batchId: number): Promise<number> {
    const batch = await this.repo.findOne({ where: { id: batchId } });
    if (!batch || batch.status === CoinBatchStatus.Reversed) return 0;

    const removed = batch.amount_remaining;
    await this.repo.update(batchId, {
      status: CoinBatchStatus.Reversed,
      amount_remaining: 0,
    });
    return removed;
  }
}
