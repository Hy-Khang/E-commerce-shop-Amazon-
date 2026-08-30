import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { MessageStatus } from '../types/chat.types';

@Injectable()
export class MessageRepository {
  constructor(
    @InjectRepository(Message)
    private readonly repo: Repository<Message>,
  ) {}

  async create(data: Partial<Message>): Promise<Message> {
    const message = this.repo.create(data);
    return this.repo.save(message);
  }

  /** Newest-first page of a conversation's messages (frontend reverses to display). */
  async findByConversationPaginated(
    conversationId: number,
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<Message>> {
    const [data, total] = await this.repo.findAndCount({
      where: { conversation_id: conversationId },
      order: { created_at: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateStatus(id: number, status: MessageStatus): Promise<void> {
    await this.repo.update({ id }, { status });
  }

  /**
   * Mark the counterpart's messages in a conversation as read (everything not
   * sent by `readerUserId` that isn't already read). Returns affected count.
   */
  async markConversationRead(
    conversationId: number,
    readerUserId: number,
  ): Promise<number> {
    const result = await this.repo.update(
      {
        conversation_id: conversationId,
        sender_id: Not(readerUserId),
        status: Not(MessageStatus.Read),
      },
      { status: MessageStatus.Read },
    );
    return result.affected ?? 0;
  }
}
