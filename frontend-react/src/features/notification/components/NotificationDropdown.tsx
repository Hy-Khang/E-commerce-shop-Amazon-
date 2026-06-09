import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { useNotifications } from '../hooks/useNotifications';
import { useMarkAllAsRead } from '../hooks/useMarkAllAsRead';
import { useNotificationStore } from '../stores/notification.store';
import { NotificationItem } from './NotificationItem';

interface Props {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: Props) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications({ limit: 10 });
  const markAllAsRead = useMarkAllAsRead();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const notifications = data?.data ?? [];

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border-default bg-white shadow-lg ring-1 ring-black/5 overflow-hidden z-50"
    >
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="py-8 text-center text-sm text-text-muted">
            No notifications yet
          </div>
        )}

        {!isLoading &&
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={onClose}
            />
          ))}
      </div>

      {!isLoading && notifications.length > 0 && (
        <div className="border-t border-border-default">
          <Link
            to={ROUTES.NOTIFICATIONS}
            onClick={onClose}
            className="block py-2.5 text-center text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-neutral-50 transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
