import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { toNotificationResponse } from './utils/notification.util';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async getMyNotifications(
    userId: number,
    query: NotificationQueryDto,
  ): Promise<IPaginatedResult<NotificationResponseDto>> {
    const result = await this.notificationRepository.findByUserIdPaginated(
      userId,
      query.page,
      query.limit,
      query.is_read,
      query.context,
    );

    return {
      data: result.data.map(toNotificationResponse),
      meta: result.meta,
    };
  }

  async getUnreadCount(
    userId: number,
    context?: string,
  ): Promise<{ count: number }> {
    const count = await this.notificationRepository.countUnread(
      userId,
      context,
    );
    return { count };
  }

  async markAsRead(
    userId: number,
    id: number,
  ): Promise<NotificationResponseDto> {
    const affected = await this.notificationRepository.markAsRead(id, userId);
    if (affected === 0) {
      const exists = await this.notificationRepository.findById(id, userId);
      if (!exists) {
        throw new NotFoundException({
          code: 'NOTIFICATION_001',
          message: 'Notification not found',
        });
      }
      return toNotificationResponse(exists);
    }

    const updated = await this.notificationRepository.findById(id, userId);
    return toNotificationResponse(updated!);
  }

  async markAllAsRead(userId: number, context?: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId, context);
  }
}
