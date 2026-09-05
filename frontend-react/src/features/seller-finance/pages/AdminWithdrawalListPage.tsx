import { useState } from 'react';
import { Banknote, Check, X, Loader2 } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import {
  AdminDataTable,
  type Column,
} from '@/common/components/data/AdminDataTable';
import { AdminSelect } from '@/common/components/data/AdminSelect';
import {
  useAdminWithdrawals,
  useApproveWithdrawal,
  useRejectWithdrawal,
} from '../hooks/useAdminWithdrawals';
import { WithdrawalStatusBadge } from '../components/WithdrawalStatusBadge';
import type {
  Withdrawal,
  WithdrawalStatus,
} from '../types/seller-finance.types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminWithdrawalListPage() {
  const { params, setPage } = usePagination();
  const [status, setStatus] = useState<WithdrawalStatus | ''>('pending');
  const [rejectTarget, setRejectTarget] = useState<Withdrawal | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useAdminWithdrawals({
    page: params.page,
    limit: params.limit,
    status: status || undefined,
  });
  const approve = useApproveWithdrawal();
  const reject = useRejectWithdrawal();

  const columns: Column<Withdrawal>[] = [
    {
      key: 'amount',
      header: 'Amount',
      render: (w) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {formatPrice(w.amount)}
        </span>
      ),
    },
    {
      key: 'bank',
      header: 'Bank',
      render: (w) => (
        <div className="min-w-0">
          <div className="truncate text-sm text-slate-900 dark:text-slate-100">
            {w.bank_name} · {w.bank_account_number}
          </div>
          <div className="truncate text-xs text-slate-400 dark:text-slate-500">
            {w.bank_account_holder}
          </div>
        </div>
      ),
    },
    {
      key: 'applicant',
      header: 'Seller',
      render: (w) => (
        <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
          #{w.user_id}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (w) => <WithdrawalStatusBadge status={w.status} />,
    },
    {
      key: 'created',
      header: 'Created',
      render: (w) => (
        <span className="text-slate-500 dark:text-slate-400">
          {formatDate(w.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (w) =>
        w.status === 'pending' ? (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => approve.mutate(w.id)}
              disabled={approve.isPending}
              className="inline-flex rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-500 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
              aria-label="Approve"
              title="Approve (paid out-of-band)"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setRejectTarget(w);
                setRejectReason('');
              }}
              className="inline-flex rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              aria-label="Reject"
              title="Reject (refund)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Withdrawal requests
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Approve (paid out-of-band) or reject (refund to the seller's wallet).
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyIcon={Banknote}
        emptyTitle="No requests"
        emptyDescription="Withdrawal requests will show up here."
        toolbar={
          <div className="admin-card p-4">
            <div className="w-56">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Status
              </label>
              <AdminSelect
                className="mt-1"
                value={status}
                onChange={(v) => {
                  setStatus(v as WithdrawalStatus | '');
                  setPage(1);
                }}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
        }
      />

      {rejectTarget && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Reject withdrawal request
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {formatPrice(rejectTarget.amount)} will be refunded to the seller's wallet.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="admin-input mt-4"
              placeholder="Rejection reason (optional)"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  reject.mutate(
                    { id: rejectTarget.id, reject_reason: rejectReason || undefined },
                    { onSuccess: () => setRejectTarget(null) },
                  )
                }
                disabled={reject.isPending}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {reject.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Reject & refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
