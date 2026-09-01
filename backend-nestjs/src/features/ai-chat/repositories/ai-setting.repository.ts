import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiSetting } from '../entities/ai-setting.entity';

/**
 * Single-row settings store (id = 1). Reads self-heal by creating the row with
 * defaults if the table is empty (e.g. before the seed runs).
 */
@Injectable()
export class AiSettingRepository {
  constructor(
    @InjectRepository(AiSetting)
    private readonly repo: Repository<AiSetting>,
  ) {}

  async get(): Promise<AiSetting> {
    const [existing] = await this.repo.find({ order: { id: 'ASC' }, take: 1 });
    if (existing) return existing;
    return this.repo.save(
      this.repo.create({ chatbox_enabled: true, system_prompt: null }),
    );
  }

  async update(patch: Partial<AiSetting>): Promise<AiSetting> {
    const current = await this.get();
    await this.repo.update(current.id, {
      ...patch,
      updated_at: () => 'SYSUTCDATETIME()',
    } as any);
    return this.get();
  }
}
