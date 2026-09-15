import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WithdrawalRequest } from '../entities/withdrawal-request.entity';
import { WithdrawalStatus } from '../types/seller-finance.types';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

export interface IWithdrawalFilter {
  status?: WithdrawalStatus;
  userId?: number;
  page: number;
  limit: number;
}

@Injectable()
export class WithdrawalRequestRepository {
  constructor(
    @InjectRepository(WithdrawalRequest)
    private readonly repo: Repository<WithdrawalRequest>,
  ) {}

  async create(
    data: Partial<WithdrawalRequest>,
    manager?: EntityManager,
  ): Promise<WithdrawalRequest> {
    if (manager) {
      return manager.save(manager.create(WithdrawalRequest, data));
    }
    return this.repo.save(this.repo.create(data));
  }

  async findById(id: number): Promise<WithdrawalRequest | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findPaginated(
    filter: IWithdrawalFilter,
  ): Promise<IPaginatedResult<WithdrawalRequest>> {
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = filter.status;
    if (filter.userId) where.user_id = filter.userId;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { created_at: 'DESC', id: 'DESC' },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    });

    return {
      data,
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async update(
    id: number,
    data: Partial<WithdrawalRequest>,
    manager?: EntityManager,
  ): Promise<void> {
    if (manager) {
      await manager.update(WithdrawalRequest, id, data);
      return;
    }
    await this.repo.update(id, data);
  }
}
