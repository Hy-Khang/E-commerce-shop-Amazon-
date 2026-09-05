import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SellerApplication } from '../entities/seller-application.entity';
import {
  ISellerApplicationFilter,
  SellerApplicationStatus,
} from '../types/seller-application.types';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class SellerApplicationRepository {
  constructor(
    @InjectRepository(SellerApplication)
    private readonly repo: Repository<SellerApplication>,
  ) {}

  async create(
    data: Partial<SellerApplication>,
    manager?: EntityManager,
  ): Promise<SellerApplication> {
    if (manager) {
      return manager.save(manager.create(SellerApplication, data));
    }
    return this.repo.save(this.repo.create(data));
  }

  async findById(id: number): Promise<SellerApplication | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** The user's most recent application (any status) — drives the FE status view. */
  async findLatestByUserId(userId: number): Promise<SellerApplication | null> {
    return this.repo.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC', id: 'DESC' },
    });
  }

  async existsPendingByUserId(userId: number): Promise<boolean> {
    const count = await this.repo.count({
      where: { user_id: userId, status: SellerApplicationStatus.Pending },
    });
    return count > 0;
  }

  async findPaginated(
    filter: ISellerApplicationFilter,
  ): Promise<IPaginatedResult<SellerApplication>> {
    const where = filter.status ? { status: filter.status } : {};
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
    data: Partial<SellerApplication>,
    manager?: EntityManager,
  ): Promise<void> {
    if (manager) {
      await manager.update(SellerApplication, id, data);
      return;
    }
    await this.repo.update(id, data);
  }
}
