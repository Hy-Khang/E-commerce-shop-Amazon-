import { useNavigate } from 'react-router-dom';
import type { Notification } from '../types/notification.types';
import { formatRelativeTime } from '../utils/notification.util';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { useNotificationRoutes } from '../hooks/useNotificationRoutes';

interface Props {
  notification: Notification;
  onClose: () => void;
}

export function NotificationItem({ notification, onClose }: Props) {
  const navigate = useNavigate();
  const { context, orderDetailPath } = useNotificationRoutes();
  const markAsRead = useMarkAsRead(context);

  function handleClick() {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.data?.orderId) {
      navigate(orderDetailPath(notification.data.orderId));
    }
    onClose();
  }

  return (
    <button
      onClick={handleClick}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
        !notification.is_read ? 'bg-primary-50/40' : ''
      }`}
    >
      <div className="mt-1.5 shrink-0">
        {!notification.is_read && (
          <span className="block h-2 w-2 rounded-full bg-primary-500" />
        )}
        {notification.is_read && <span className="block h-2 w-2" />}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${
            !notification.is_read
              ? 'font-semibold text-text-primary'
              : 'font-medium text-text-secondary'
          }`}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-text-muted line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-[11px] text-text-muted">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>
    </button>
  );
}
