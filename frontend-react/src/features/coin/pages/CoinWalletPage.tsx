import { useState } from 'react';
import { Coins, Clock, Loader2 } from 'lucide-react';
import { formatDate } from '@/common/utils/format.util';
import { Pagination } from '@/common/components/data/Pagination';
import { useCoinBalance } from '../hooks/useCoinBalance';
import { useCoinTransactions } from '../hooks/useCoinTransactions';
import type { CoinTransactionType } from '../types/coin.types';

const TXN_META: Record<
  CoinTransactionType,
  { label: string; sign: '+' | '-'; className: string }
> = {
  earn: { label: 'Earned', sign: '+', className: 'text-emerald-700' },
  refund: { label: 'Refunded', sign: '+', className: 'text-emerald-700' },
  redeem: { label: 'Redeemed', sign: '-', className: 'text-rose-700' },
  reverse_earn: { label: 'Reversed', sign: '-', className: 'text-rose-700' },
  expire: { label: 'Expired', sign: '-', className: 'text-text-muted' },
};

export default function CoinWalletPage() {
  const [page, setPage] = useState(1);
  const { data: balance, isLoading: balanceLoading } = useCoinBalance();
  const { data: txns, isLoading: txnsLoading } = useCoinTransactions(page);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-text-primary">My Coins</h1>

      {/* Balance */}
      <div className="rounded-xl border border-border-default bg-gradient-to-br from-amber-50 to-elevated p-6">
        <div className="flex items-center gap-2 text-text-secondary">
          <Coins className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-medium">Available balance</span>
        </div>
        <p className="mt-2 text-3xl font-bold text-text-primary">
          {balanceLoading
            ? '—'
            : `${(balance?.balance ?? 0).toLocaleString('vi-VN')} Coins`}
        </p>
        <p className="mt-1 text-xs text-text-muted">1 Coin = 1 ₫ · redeem at checkout</p>

        {balance && balance.expiring_soon.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t border-amber-200/60 pt-4">
            {balance.expiring_soon.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-amber-700"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {b.amount.toLocaleString('vi-VN')} Coins expiring on{' '}
                  {formatDate(b.expires_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ledger */}
      <div className="rounded-xl border border-border-default bg-elevated p-6">
        <h2 className="mb-4 text-lg font-bold tracking-tight text-text-primary">
          History
        </h2>

        {txnsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          </div>
        ) : !txns || txns.data.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Coins className="h-12 w-12 text-text-muted/60" />
            <p className="mt-3 text-sm text-text-secondary">No coin activity yet.</p>
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
                        {meta.label}
                      </p>
                      <p className="text-xs text-text-muted">
                        {t.note ?? '—'} · {formatDate(t.created_at)}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${meta.className}`}>
                      {meta.sign}
                      {t.amount.toLocaleString('vi-VN')} Coins
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
