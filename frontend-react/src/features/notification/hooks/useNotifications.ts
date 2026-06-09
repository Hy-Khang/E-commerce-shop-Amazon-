import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';
import type { NotificationListParams } from '../types/notification.types';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params: NotificationListParams) => ['notifications', 'list', params] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
};

export function useNotifications(params: NotificationListParams = {}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationService.getList(params).then((res) => ({
      data: res.data.data,
      meta: res.data.meta,
    })),
    staleTime: 60 * 1000,
  });
}
