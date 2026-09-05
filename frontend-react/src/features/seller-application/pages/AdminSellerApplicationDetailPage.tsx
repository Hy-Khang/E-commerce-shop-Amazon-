import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import {
  useSellerApplicationDetail,
} from '../hooks/useSellerApplication';
import {
  useApproveApplication,
  useRejectApplication,
} from '../hooks/useReviewApplication';
import { ApplicationStatusBadge } from '../components/ApplicationStatusBadge';

export default function AdminSellerApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const appId = Number(id);
  const { data: app, isLoading } = useSellerApplicationDetail(appId);
  const approve = useApproveApplication();
  const reject = useRejectApplication();
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  if (isLoading || !app) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
      </div>
    );
  }

  const isPending = app.status === 'pending';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to={ROUTES.ADMIN_SELLER_APPLICATIONS}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> Applications
      </Link>

      <div className="admin-card space-y-5 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {app.shop_name}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Applicant #{app.user_id} · {formatDate(app.created_at)}
            </p>
          </div>
          <ApplicationStatusBadge status={app.status} />
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Info label="Phone number" value={app.phone} />
          <Info label="Business name" value={app.business_name || '—'} />
          <Info label="Tax ID / National ID" value={app.tax_id || '—'} />
          <Info
            label="Reviewed at"
            value={app.reviewed_at ? formatDate(app.reviewed_at) : '—'}
          />
        </dl>

        {app.description && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Description
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              {app.description}
            </p>
          </div>
        )}

        {app.status === 'rejected' && app.reject_reason && (
          <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            Rejection reason: {app.reject_reason}
          </div>
        )}

        {isPending && (
          <div className="space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            {!showReject ? (
              <div className="flex gap-3">
                <button
                  onClick={() => approve.mutate(appId)}
                  disabled={approve.isPending}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  {approve.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Rejection reason (optional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="admin-input"
                  placeholder="e.g. Incomplete information..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      reject.mutate({
                        id: appId,
                        reject_reason: rejectReason || undefined,
                      })
                    }
                    disabled={reject.isPending}
                    className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                  >
                    {reject.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Confirm rejection
                  </button>
                  <button
                    onClick={() => setShowReject(false)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-slate-900 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}
