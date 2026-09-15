import { useState } from 'react';
import { Wallet, Loader2 } from 'lucide-react';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { Pagination } from '@/common/components/data/Pagination';
import {
  useWallet,
  useWalletTransactions,
  useMyWithdrawals,
} from '../hooks/useWallet';
import { WithdrawalRequestForm } from '../components/WithdrawalRequestForm';
import { WithdrawalStatusBadge } from '../components/WithdrawalStatusBadge';
import type { WalletTransactionType } from '../types/seller-finance.types';

const TXN_META: Record<
  WalletTransactionType,
  { label: string; sign: '+' | '-'; cls: string }
> = {
  sale_earning: { label: 'Sale earning', sign: '+', cls: 'text-emerald-600 dark:text-emerald-400' },
  withdrawal_refund: { label: 'Withdrawal refund', sign: '+', cls: 'text-emerald-600 dark:text-emerald-400' },
  withdrawal: { label: 'Withdrawal', sign: '-', cls: 'text-rose-600 dark:text-rose-400' },
  reversal: { label: 'Order reversal', sign: '-', cls: 'text-rose-600 dark:text-rose-400' },
};

export default function SellerWalletPage() {
  const [txnPage, setTxnPage] = useState(1);
  const [wdPage, setWdPage] = useState(1);
  const { data: wallet, isLoading } = useWallet();
  const { data: txns } = useWalletTransactions(txnPage);
  const { data: withdrawals } = useMyWithdrawals(wdPage);

  const balance = wallet?.balance ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Wallet className="h-6 w-6 text-amber-600" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Seller wallet
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-6 text-white shadow-sm">
          <p className="text-sm font-medium text-amber-50">Available balance</p>
          <p className="mt-2 text-3xl font-bold">
            {isLoading ? '—' : formatPrice(balance)}
          </p>
          <p className="mt-1 text-xs text-amber-100/80">
            Net revenue after the platform commission is credited to your wallet when an order completes.
          </p>
        </div>

        <WithdrawalRequestForm balance={balance} />
      </div>

      {/* Wallet ledger */}
      <div className="admin-card p-6">
        <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
          Wallet ledger
        </h2>
        {!txns ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : txns.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No transactions yet.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {txns.data.map((t) => {
                const meta = TXN_META[t.type];
                return (
                  <li key={t.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {meta.label}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {t.note ?? '—'} · {formatDate(t.created_at)}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${meta.cls}`}>
                      {meta.sign}
                      {formatPrice(t.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Pagination
              page={txnPage}
              totalPages={txns.meta.totalPages}
              onPageChange={setTxnPage}
              className="mt-4"
            />
          </>
        )}
      </div>

      {/* Withdrawal history */}
      <div className="admin-card p-6">
        <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
          Withdrawal history
        </h2>
        {!withdrawals || withdrawals.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No withdrawal requests yet.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {withdrawals.data.map((w) => (
                <li key={w.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {formatPrice(w.amount)} · {w.bank_name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {w.bank_account_number} · {formatDate(w.created_at)}
                      {w.reject_reason ? ` · ${w.reject_reason}` : ''}
                    </p>
                  </div>
                  <WithdrawalStatusBadge status={w.status} />
                </li>
              ))}
            </ul>
            <Pagination
              page={wdPage}
              totalPages={withdrawals.meta.totalPages}
              onPageChange={setWdPage}
              className="mt-4"
            />
          </>
        )}
      </div>
    </div>
  );
}
