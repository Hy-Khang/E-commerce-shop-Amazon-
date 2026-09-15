import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CoinTransaction } from '../entities/coin-transaction.entity';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class CoinTransactionRepository {
  constructor(
    @InjectRepository(CoinTransaction)
    private readonly repo: Repository<CoinTransaction>,
  ) {}

  async create(
    data: Partial<CoinTransaction>,
    manager?: EntityManager,
  ): Promise<CoinTransaction> {
    if (manager) {
      return manager.save(manager.create(CoinTransaction, data));
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

  async findByUserPaginated(
    userId: number,
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<CoinTransaction>> {
    const [data, total] = await this.repo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
