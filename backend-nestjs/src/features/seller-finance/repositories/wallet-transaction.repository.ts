import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class WalletTransactionRepository {
  constructor(
    @InjectRepository(WalletTransaction)
    private readonly repo: Repository<WalletTransaction>,
  ) {}

  async create(
    data: Partial<WalletTransaction>,
    manager?: EntityManager,
  ): Promise<WalletTransaction> {
    if (manager) {
      return manager.save(manager.create(WalletTransaction, data));
    }
    return this.repo.save(this.repo.create(data));
  }

  async findByUserPaginated(
    userId: number,
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<WalletTransaction>> {
    const [data, total] = await this.repo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
