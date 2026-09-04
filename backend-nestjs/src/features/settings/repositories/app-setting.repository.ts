import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AppSetting } from '../entities/app-setting.entity';

@Injectable()
export class AppSettingRepository {
  constructor(
    @InjectRepository(AppSetting)
    private readonly repo: Repository<AppSetting>,
  ) {}

  async findByKeys(keys: string[]): Promise<AppSetting[]> {
    if (keys.length === 0) return [];
    return this.repo.find({ where: { key: In(keys) } });
  }

  /**
   * Idempotent upsert of a single key. UPDATE first (the common case — keys are
   * seeded), INSERT only when the row does not exist yet.
   */
  async upsert(
    key: string,
    value: string,
    updatedBy: number | null,
  ): Promise<void> {
    const result = await this.repo
      .createQueryBuilder()
      .update(AppSetting)
      .set({
        value,
        updated_by: updatedBy,
        updated_at: () => 'SYSUTCDATETIME()',
      })
      .where('[key] = :key', { key })
      .execute();

    if ((result.affected ?? 0) === 0) {
      await this.repo.save(
        this.repo.create({ key, value, updated_by: updatedBy }),
      );
    }
  }
}
