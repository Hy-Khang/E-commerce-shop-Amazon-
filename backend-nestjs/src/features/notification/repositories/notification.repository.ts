import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async findByUserIdPaginated(
    userId: number,
    page: number,
    limit: number,
    isRead?: boolean,
  ): Promise<IPaginatedResult<Notification>> {
    const where: Record<string, unknown> = { user_id: userId };
    if (isRead !== undefined) {
      where.is_read = isRead;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { created_at: 'DESC' },
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

  async countUnread(userId: number): Promise<number> {
    return this.repo.count({
      where: { user_id: userId, is_read: false },
    });
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    const notification = this.repo.create(data);
    return this.repo.save(notification);
  }

  async markAsRead(id: number, userId: number): Promise<number> {
    const result = await this.repo.update(
      { id, user_id: userId, is_read: false },
      { is_read: true },
    );
    return result.affected ?? 0;
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.repo.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );
  }

  async findById(id: number, userId: number): Promise<Notification | null> {
    return this.repo.findOne({ where: { id, user_id: userId } });
  }
}
