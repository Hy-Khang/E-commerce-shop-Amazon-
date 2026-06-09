import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth';
import { notificationService } from '../services/notification.service';
import { useNotificationStore } from '../stores/notification.store';
import { notificationKeys } from './useNotifications';

export function useUnreadCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const query = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount().then((res) => res.data.data),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (query.data) {
      setUnreadCount(query.data.count);
    }
  }, [query.data, setUnreadCount]);

  return query;
}
