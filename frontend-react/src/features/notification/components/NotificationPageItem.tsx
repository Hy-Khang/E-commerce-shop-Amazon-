import { Link } from 'react-router-dom';
import type { Notification } from '../types/notification.types';
import { formatRelativeTime } from '../utils/notification.util';

interface Props {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  orderDetailPath: (id: number) => string;
}

export function NotificationPageItem({ notification, onMarkAsRead, orderDetailPath }: Props) {
  const orderLink = notification.data?.orderId
    ? orderDetailPath(notification.data.orderId)
    : null;

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        !notification.is_read
          ? 'border-primary-200 bg-primary-50/30'
          : 'border-border-default bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="mt-1.5 shrink-0">
            {!notification.is_read ? (
              <span className="block h-2.5 w-2.5 rounded-full bg-primary-500" />
            ) : (
              <span className="block h-2.5 w-2.5 rounded-full bg-slate-200" />
            )}
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
            <p className="mt-1 text-sm text-text-muted">{notification.message}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">
                  {formatRelativeTime(notification.created_at)}
                </span>
                {!notification.is_read && (
                  <button
                    onClick={() => onMarkAsRead(notification.id)}
                    className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Mark as read
                  </button>
                )}
              </div>
              {orderLink && (
                <Link
                  to={orderLink}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  View Order
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
