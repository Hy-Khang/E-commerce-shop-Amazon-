import { Loader2, CreditCard } from 'lucide-react';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { usePaymentsByOrder } from '../hooks/usePaymentsByOrder';
import type { TransactionStatus, PaymentGateway } from '../types/payment.types';

interface Props {
  orderId: number;
  variant?: 'customer' | 'admin';
}

const STATUS_STYLES: Record<TransactionStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  refunded: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded',
};

const GATEWAY_LABELS: Record<PaymentGateway, string> = {
  vnpay: 'VNPay',
  momo: 'MoMo',
};

export function PaymentTransactionList({ orderId, variant = 'customer' }: Props) {
  const { data: transactions, isLoading } = usePaymentsByOrder(orderId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!transactions || transactions.length === 0) return null;

  const isAdmin = variant === 'admin';
  const cardClass = isAdmin ? 'admin-card' : 'shop-card';
  const titleClass = isAdmin ? 'text-slate-900 dark:text-slate-100' : 'text-text-primary';
  const labelClass = isAdmin ? 'text-slate-500 dark:text-slate-400' : 'text-text-secondary';
  const valueClass = isAdmin ? 'text-slate-900 dark:text-slate-100' : 'text-text-primary';

  return (
    <div className={`${cardClass} p-6`}>
      <div className="mb-4 flex items-center gap-2">
        <CreditCard className={`h-5 w-5 ${labelClass}`} />
        <h2 className={`text-lg font-bold tracking-tight ${titleClass}`}>
          Payment Transactions
        </h2>
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className={`rounded-lg border ${isAdmin ? 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50' : 'border-border-default bg-surface-hover/50'} p-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium ${labelClass}`}>
                {GATEWAY_LABELS[tx.gateway]}
              </span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[tx.status]}`}>
                {STATUS_LABELS[tx.status]}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={valueClass}>{formatPrice(tx.amount)}</span>
              <span className={`text-xs ${labelClass}`}>{formatDate(tx.created_at)}</span>
            </div>
            {isAdmin && tx.transaction_ref && (
              <p className="mt-1 text-xs text-slate-400 font-mono truncate dark:text-slate-500">
                Ref: {tx.transaction_ref}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
