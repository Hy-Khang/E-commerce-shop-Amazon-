import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type { Notification, UnreadCount, NotificationListParams } from '../types/notification.types';

export const notificationService = {
  getList: (params: NotificationListParams) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),

  getUnreadCount: () =>
    api.get<SuccessResponse<UnreadCount>>('/notifications/unread-count'),

  markAsRead: (id: number) =>
    api.patch<SuccessResponse<Notification>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch('/notifications/read-all'),
};
