import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { Button } from '@/common/components/ui/Button';
import { ROUTES } from '@/common/constants/routes';
import { useEnumLabel } from '@/common/i18n';
import type { OrderStatus } from '../types/order.types';
import { useOrders } from '../hooks/useOrders';
import { OrderStatusTabs } from '../components/OrderStatusTabs';
import { OrderCard } from '../components/OrderCard';
import { OrderListSkeleton } from '../components/OrderListSkeleton';

export default function OrderHistoryPage() {
  const { t } = useTranslation('order');
  const enumLabel = useEnumLabel();
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const { params, setPage } = usePagination({ limit: 10, sort: 'created_at', order: 'desc' });
  const { data, isLoading } = useOrders({ ...params, status });

  function handleStatusChange(newStatus: OrderStatus | undefined) {
    setStatus(newStatus);
    setPage(1);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-primary">{t('history.title')}</h1>

      <OrderStatusTabs activeStatus={status} onChange={handleStatusChange} />

      <div className="mt-6">
        {isLoading ? (
          <OrderListSkeleton />
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-16 w-16 text-text-muted/60" />
            <h2 className="mt-4 text-lg font-semibold text-text-primary">{t('history.emptyTitle')}</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {status
                ? t('history.emptyFiltered', { status: enumLabel('orderStatus', status) })
                : t('history.emptyDefault')}
            </p>
            {!status && (
              <Link to={ROUTES.PRODUCTS} className="mt-6">
                <Button>{t('history.browseProducts')}</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {data.data.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>

            {data.meta.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(data.meta.page - 1)}
                  disabled={data.meta.page <= 1}
                >
                  {t('pagination.previous')}
                </Button>
                <span className="text-sm text-text-secondary">
                  {t('pagination.pageOf', { page: data.meta.page, total: data.meta.totalPages })}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(data.meta.page + 1)}
                  disabled={data.meta.page >= data.meta.totalPages}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
