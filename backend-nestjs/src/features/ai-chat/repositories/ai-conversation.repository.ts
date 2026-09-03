import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConversation } from '../entities/ai-conversation.entity';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class AiConversationRepository {
  constructor(
    @InjectRepository(AiConversation)
    private readonly repo: Repository<AiConversation>,
  ) {}

  async findById(id: number): Promise<AiConversation | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<AiConversation>): Promise<AiConversation> {
    return this.repo.save(this.repo.create(data));
  }

  async touch(id: number): Promise<void> {
    await this.repo.update(id, { updated_at: () => 'SYSUTCDATETIME()' });
  }

  /** Admin: paginated list, newest activity first. */
  async findAllPaginated(
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<AiConversation>> {
    const [data, total] = await this.repo.findAndCount({
      order: { updated_at: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
