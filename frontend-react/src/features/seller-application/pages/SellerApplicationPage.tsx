import {
  Loader2,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { formatDate } from '@/common/utils/format.util';
import { useTranslation, Trans } from 'react-i18next';
import { useMyApplication } from '../hooks/useSellerApplication';
import { useEnterSellerCenter } from '../hooks/useEnterSellerCenter';
import { SellerApplicationForm } from '../components/SellerApplicationForm';

export default function SellerApplicationPage() {
  const { t } = useTranslation('sellerApplication');
  const { data: application, isLoading } = useMyApplication();
  const { enter, isEntering } = useEnterSellerCenter();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  const status = application?.status;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-text-brand" />
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {t('page.title')}
          </h1>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {t('page.subtitle')}
        </p>
      </div>

      {status === 'pending' && (
        <div className="shop-card space-y-3 border-amber-200 bg-gradient-to-br from-amber-50 to-elevated p-6">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-semibold">{t('page.status.pending.title')}</span>
          </div>
          <p className="text-sm text-text-secondary">
            <Trans
              i18nKey="page.status.pending.description"
              t={t}
              values={{
                shop: application?.shop_name,
                date: application ? formatDate(application.created_at) : '',
              }}
              components={{ 1: <strong /> }}
            />
          </p>
        </div>
      )}

      {status === 'approved' && (
        <div className="shop-card space-y-4 border-emerald-200 bg-gradient-to-br from-emerald-50 to-elevated p-6">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-semibold">{t('page.status.approved.title')}</span>
          </div>
          <p className="text-sm text-text-secondary">
            <Trans
              i18nKey="page.status.approved.description"
              t={t}
              values={{ shop: application?.shop_name }}
              components={{ 1: <strong /> }}
            />
          </p>
          <button
            onClick={enter}
            disabled={isEntering}
            className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {isEntering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {t('page.status.approved.enter')}
          </button>
        </div>
      )}

      {status === 'rejected' && (
        <>
          <div className="shop-card space-y-2 border-rose-200 bg-gradient-to-br from-rose-50 to-elevated p-6">
            <div className="flex items-center gap-2 text-rose-700">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">{t('page.status.rejected.title')}</span>
            </div>
            {application?.reject_reason ? (
              <p className="text-sm text-text-secondary">
                {t('page.status.rejected.reason', { reason: application.reject_reason })}
              </p>
            ) : (
              <p className="text-sm text-text-secondary">
                {t('page.status.rejected.description')}
              </p>
            )}
          </div>
          <SellerApplicationForm
            defaultValues={{
              shop_name: application?.shop_name,
              phone: application?.phone,
              business_name: application?.business_name ?? '',
              tax_id: application?.tax_id ?? '',
              description: application?.description ?? '',
            }}
          />
        </>
      )}

      {!application && <SellerApplicationForm />}
    </div>
  );
}
