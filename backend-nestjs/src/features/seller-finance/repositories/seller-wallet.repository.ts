import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SellerWallet } from '../entities/seller-wallet.entity';

@Injectable()
export class SellerWalletRepository {
  constructor(
    @InjectRepository(SellerWallet)
    private readonly repo: Repository<SellerWallet>,
  ) {}

  private manager(manager?: EntityManager): Repository<SellerWallet> {
    return manager ? manager.getRepository(SellerWallet) : this.repo;
  }

  async findByUserId(
    userId: number,
    manager?: EntityManager,
  ): Promise<SellerWallet | null> {
    return this.manager(manager).findOne({ where: { user_id: userId } });
  }

  /** Return the wallet, self-healing an empty one on first read (balance 0). */
  async getOrCreate(
    userId: number,
    manager?: EntityManager,
  ): Promise<SellerWallet> {
    const repo = this.manager(manager);
    const existing = await repo.findOne({ where: { user_id: userId } });
    if (existing) return existing;
    return repo.save(repo.create({ user_id: userId, balance: 0 }));
  }

  /** Credit the wallet (create it if missing). Non-atomic add is safe — only the
   * order-completion path credits, and it is idempotent per order upstream. */
  async credit(
    userId: number,
    amount: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.manager(manager);
    await this.getOrCreate(userId, manager);
    await repo
      .createQueryBuilder()
      .update(SellerWallet)
      .set({
        balance: () => 'balance + :amount',
        updated_at: () => 'SYSUTCDATETIME()',
      })
      .where('user_id = :userId', { userId })
      .setParameter('amount', amount)
      .execute();
  }

  /**
   * Atomically debit the wallet only if the balance covers `amount`. Returns
   * true when the row was updated (sufficient funds), false otherwise.
   */
  async debitIfSufficient(
    userId: number,
    amount: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repo = this.manager(manager);
    const result = await repo
      .createQueryBuilder()
      .update(SellerWallet)
      .set({
        balance: () => 'balance - :amount',
        updated_at: () => 'SYSUTCDATETIME()',
      })
      .where('user_id = :userId AND balance >= :amount', { userId, amount })
      .setParameter('amount', amount)
      .execute();
    return (result.affected ?? 0) > 0;
  }

  /** Unconditional debit (may drive balance negative) — used only for the
   * defensive commission reversal, which allows controlled debt. */
  async debitAllowNegative(
    userId: number,
    amount: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.manager(manager);
    await this.getOrCreate(userId, manager);
    await repo
      .createQueryBuilder()
      .update(SellerWallet)
      .set({
        balance: () => 'balance - :amount',
        updated_at: () => 'SYSUTCDATETIME()',
      })
      .where('user_id = :userId', { userId })
      .setParameter('amount', amount)
      .execute();
  }
}
