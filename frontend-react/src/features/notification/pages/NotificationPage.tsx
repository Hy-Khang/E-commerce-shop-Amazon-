import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePagination } from '@/common/hooks/usePagination';
import { Pagination } from '@/common/components/data/Pagination';
import { useNotifications } from '../hooks/useNotifications';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { useMarkAllAsRead } from '../hooks/useMarkAllAsRead';
import { useNotificationStore } from '../stores/notification.store';
import { useNotificationRoutes } from '../hooks/useNotificationRoutes';
import { NotificationPageItem } from '../components/NotificationPageItem';

export default function NotificationPage() {
  const { t } = useTranslation('notification');
  const { params, setPage } = usePagination({ limit: 15 });
  const { orderDetailPath, context } = useNotificationRoutes();
  const { data, isLoading } = useNotifications({
    page: params.page,
    limit: params.limit,
    context,
  });
  const markAsRead = useMarkAsRead(context);
  const markAllAsRead = useMarkAllAsRead(context);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isCustomer = context === 'customer';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-40 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            {isCustomer ? t('page.titleCustomer') : t('page.titlePortal')}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {isCustomer ? t('page.subtitleCustomer') : t('page.subtitlePortal')}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="text-sm font-medium text-text-brand hover:text-primary-700 dark:hover:text-primary-200 transition-colors disabled:opacity-50"
          >
            {t('markAllRead')}
          </button>
        )}
      </div>

      {!data || data.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-14 w-14 text-text-muted/60" />
          <h2 className="mt-4 text-base font-semibold text-text-primary">{t('page.emptyTitle')}</h2>
          <p className="mt-1 text-sm text-text-secondary max-w-xs">
            {isCustomer
              ? t('page.emptyDescriptionCustomer')
              : t('page.emptyDescriptionPortal')}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {t('page.count', { count: data.meta.total })}
          </p>

          <div className="space-y-2">
            {data.data.map((notification) => (
              <NotificationPageItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={(id) => markAsRead.mutate(id)}
                orderDetailPath={orderDetailPath}
              />
            ))}
          </div>

          <div className="pt-4 border-t border-border-default">
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
