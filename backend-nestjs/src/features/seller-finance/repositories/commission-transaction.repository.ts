import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CommissionTransaction } from '../entities/commission-transaction.entity';
import { CommissionTransactionType } from '../types/seller-finance.types';

@Injectable()
export class CommissionTransactionRepository {
  constructor(
    @InjectRepository(CommissionTransaction)
    private readonly repo: Repository<CommissionTransaction>,
  ) {}

  async create(
    data: Partial<CommissionTransaction>,
    manager?: EntityManager,
  ): Promise<CommissionTransaction> {
    if (manager) {
      return manager.save(manager.create(CommissionTransaction, data));
    }
    return this.repo.save(this.repo.create(data));
  }

  /** Idempotency guard: has this order already produced a txn of this type? */
  async existsByOrderAndType(orderId: number, type: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { order_id: orderId, type },
    });
    return count > 0;
  }

  async findByOrderAndType(
    orderId: number,
    type: string,
  ): Promise<CommissionTransaction | null> {
    return this.repo.findOne({ where: { order_id: orderId, type } });
  }

  /**
   * Net commissionable base and commission (both charge − reverse) for a shop
   * within [from, to). Returned from one pass so the seller dashboard's net
   * revenue derives from the same base the commission was charged on (rather
   * than a differently-scoped gross), keeping `net = base − commission` exact.
   */
  async sumBreakdownForShop(
    shopId: number,
    from: Date,
    to: Date,
  ): Promise<{ base: number; commission: number }> {
    const row = await this.repo
      .createQueryBuilder('ct')
      .select(
        `COALESCE(SUM(CASE WHEN ct.type = :charge THEN ct.base_amount ELSE -ct.base_amount END), 0)`,
        'base',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN ct.type = :charge THEN ct.commission_amount ELSE -ct.commission_amount END), 0)`,
        'commission',
      )
      .where('ct.shop_id = :shopId', { shopId })
      .andWhere('ct.created_at >= :from AND ct.created_at < :to', { from, to })
      .setParameter('charge', CommissionTransactionType.Charge)
      .getRawOne<{ base: string; commission: string }>();
    return {
      base: Number(row?.base ?? 0),
      commission: Number(row?.commission ?? 0),
    };
  }

  /** Net commission (charge − reverse) platform-wide within [from, to). */
  async sumNetAllShops(from: Date, to: Date): Promise<number> {
    const row = await this.repo
      .createQueryBuilder('ct')
      .select(
        `COALESCE(SUM(CASE WHEN ct.type = :charge THEN ct.commission_amount ELSE -ct.commission_amount END), 0)`,
        'total',
      )
      .where('ct.created_at >= :from AND ct.created_at < :to', { from, to })
      .setParameter('charge', CommissionTransactionType.Charge)
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }
}
