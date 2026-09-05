import type { SellerApplicationStatus } from '../types/seller-application.types';

const STYLES: Record<SellerApplicationStatus, { label: string; cls: string }> = {
  pending: {
    label: 'Pending',
    cls: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300',
  },
  approved: {
    label: 'Approved',
    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  rejected: {
    label: 'Rejected',
    cls: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300',
  },
};

export function ApplicationStatusBadge({
  status,
}: {
  status: SellerApplicationStatus;
}) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
