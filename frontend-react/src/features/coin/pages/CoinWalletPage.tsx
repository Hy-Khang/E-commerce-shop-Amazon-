import { useState } from 'react';
import { Coins, Clock, Loader2 } from 'lucide-react';
import { formatDate } from '@/common/utils/format.util';
import { Pagination } from '@/common/components/data/Pagination';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@/common/i18n/useFormat';
import { useCoinBalance } from '../hooks/useCoinBalance';
import { useCoinTransactions } from '../hooks/useCoinTransactions';
import type { CoinTransactionType } from '../types/coin.types';

const TXN_META: Record<
  CoinTransactionType,
  { labelKey: string; sign: '+' | '-'; className: string }
> = {
  earn: { labelKey: 'earn', sign: '+', className: 'text-emerald-700' },
  refund: { labelKey: 'refund', sign: '+', className: 'text-emerald-700' },
  redeem: { labelKey: 'redeem', sign: '-', className: 'text-rose-700' },
  reverse_earn: { labelKey: 'reverse_earn', sign: '-', className: 'text-rose-700' },
  expire: { labelKey: 'expire', sign: '-', className: 'text-text-muted' },
};

export default function CoinWalletPage() {
  const { t } = useTranslation('coin');
  const { formatDate, formatNumber } = useFormat();
  const [page, setPage] = useState(1);
  const { data: balance, isLoading: balanceLoading } = useCoinBalance();
  const { data: txns, isLoading: txnsLoading } = useCoinTransactions(page);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-text-primary">{t('wallet.title')}</h1>

      {/* Balance */}
      <div className="rounded-xl border border-border-default bg-gradient-to-br from-amber-50 to-elevated p-6">
        <div className="flex items-center gap-2 text-text-secondary">
          <Coins className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-medium">{t('wallet.availableBalance')}</span>
        </div>
        <p className="mt-2 text-3xl font-bold text-text-primary">
          {balanceLoading
            ? '—'
            : t('wallet.balance', { count: balance?.balance ?? 0 })}
        </p>
        <p className="mt-1 text-xs text-text-muted">{t('wallet.valueNote')}</p>

        {balance && balance.expiring_soon.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t border-amber-200/60 pt-4">
            {balance.expiring_soon.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-amber-700"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {t('wallet.expiring', { count: b.amount, date: formatDate(b.expires_at) })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ledger */}
      <div className="rounded-xl border border-border-default bg-elevated p-6">
        <h2 className="mb-4 text-lg font-bold tracking-tight text-text-primary">
          {t('wallet.history')}
        </h2>

        {txnsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          </div>
        ) : !txns || txns.data.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Coins className="h-12 w-12 text-text-muted/60" />
            <p className="mt-3 text-sm text-text-secondary">{t('wallet.empty')}</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-border-default">
              {txns.data.map((t) => {
                const meta = TXN_META[t.type];
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {t(`wallet.types.${meta.labelKey}` as any)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {t.note ?? '—'} · {formatDate(t.created_at)}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${meta.className}`}>
                      {meta.sign}
                      {t('wallet.balance', { count: t.amount })}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Pagination
              page={page}
              totalPages={txns.meta.totalPages}
              onPageChange={setPage}
              className="mt-4"
            />
          </>
        )}
      </div>
    </div>
  );
}
