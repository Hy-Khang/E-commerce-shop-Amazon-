import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';
import { notificationKeys } from './useNotifications';
import { useNotificationStore } from '../stores/notification.store';

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previousCount = unreadCount;
      setUnreadCount(0);
      return { previousCount };
    },

    onError: (_err, _vars, context) => {
      if (context) {
        setUnreadCount(context.previousCount);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}
