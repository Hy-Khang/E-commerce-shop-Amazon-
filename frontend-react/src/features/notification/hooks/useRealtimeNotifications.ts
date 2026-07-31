import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth';
import { connectSocket, disconnectSocket } from '@/core/socket/socket.service';
import { useNotificationStore } from '../stores/notification.store';
import { notificationKeys } from './useNotifications';
import type { Notification } from '../types/notification.types';

export function useRealtimeNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const queryClient = useQueryClient();
  const unreadCountRef = useRef(unreadCount);

  useEffect(() => {
    unreadCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    let socket: ReturnType<typeof connectSocket>;
    try {
      socket = connectSocket();
    } catch {
      return;
    }

    const handleNewNotification = (notification: Notification) => {
      setUnreadCount(unreadCountRef.current + 1);

      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });

      toast(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [isAuthenticated, setUnreadCount, queryClient]);
}
