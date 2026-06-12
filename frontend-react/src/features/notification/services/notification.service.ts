import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type { Notification, UnreadCount, NotificationListParams } from '../types/notification.types';

export const notificationService = {
  getList: (params: NotificationListParams) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),

  getUnreadCount: (context?: string) =>
    api.get<SuccessResponse<UnreadCount>>('/notifications/unread-count', {
      params: context ? { context } : undefined,
    }),

  markAsRead: (id: number) =>
    api.patch<SuccessResponse<Notification>>(`/notifications/${id}/read`),

  markAllAsRead: (context?: string) =>
    api.patch('/notifications/read-all', null, {
      params: context ? { context } : undefined,
    }),
};
