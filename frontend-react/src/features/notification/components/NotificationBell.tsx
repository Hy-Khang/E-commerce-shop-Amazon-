import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../stores/notification.store';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useNotificationRoutes } from '../hooks/useNotificationRoutes';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const { context } = useNotificationRoutes();
  useUnreadCount(context);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && <NotificationDropdown onClose={() => setIsOpen(false)} />}
    </div>
  );
}
