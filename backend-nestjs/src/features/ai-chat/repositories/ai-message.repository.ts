import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiMessage } from '../entities/ai-message.entity';

@Injectable()
export class AiMessageRepository {
  constructor(
    @InjectRepository(AiMessage)
    private readonly repo: Repository<AiMessage>,
  ) {}

  async create(data: Partial<AiMessage>): Promise<AiMessage> {
    return this.repo.save(this.repo.create(data));
  }

  /** Full thread in chronological order (used for resume + admin detail). */
  async findByConversation(conversationId: number): Promise<AiMessage[]> {
    return this.repo.find({
      where: { conversation_id: conversationId },
      order: { created_at: 'ASC', id: 'ASC' },
    });
  }

  /** The newest `limit` messages, returned oldest→newest for LLM history. */
  async findRecent(conversationId: number, limit: number): Promise<AiMessage[]> {
    const rows = await this.repo.find({
      where: { conversation_id: conversationId },
      order: { created_at: 'DESC', id: 'DESC' },
      take: limit,
    });
    return rows.reverse();
  }
}
