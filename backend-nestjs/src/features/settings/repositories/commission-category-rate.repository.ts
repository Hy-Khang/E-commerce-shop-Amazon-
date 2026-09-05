import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionCategoryRate } from '../entities/commission-category-rate.entity';

@Injectable()
export class CommissionCategoryRateRepository {
  constructor(
    @InjectRepository(CommissionCategoryRate)
    private readonly repo: Repository<CommissionCategoryRate>,
  ) {}

  async findAll(): Promise<CommissionCategoryRate[]> {
    return this.repo.find({ order: { category_id: 'ASC' } });
  }

  /** Idempotent upsert of a single category's rate. */
  async upsert(
    categoryId: number,
    ratePercent: number,
    updatedBy: number | null,
  ): Promise<void> {
    const result = await this.repo
      .createQueryBuilder()
      .update(CommissionCategoryRate)
      .set({
        rate_percent: ratePercent,
        updated_by: updatedBy,
        updated_at: () => 'SYSUTCDATETIME()',
      })
      .where('category_id = :categoryId', { categoryId })
      .execute();

    if ((result.affected ?? 0) === 0) {
      await this.repo.save(
        this.repo.create({
          category_id: categoryId,
          rate_percent: ratePercent,
          updated_by: updatedBy,
        }),
      );
    }
  }

  async delete(categoryId: number): Promise<void> {
    await this.repo.delete({ category_id: categoryId });
  }
}
