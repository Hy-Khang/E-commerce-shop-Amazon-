import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Store } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import {
  AdminDataTable,
  type Column,
} from '@/common/components/data/AdminDataTable';
import { AdminSelect } from '@/common/components/data/AdminSelect';
import { useSellerApplications } from '../hooks/useSellerApplication';
import { ApplicationStatusBadge } from '../components/ApplicationStatusBadge';
import type {
  SellerApplication,
  SellerApplicationStatus,
} from '../types/seller-application.types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminSellerApplicationListPage() {
  const { params, setPage } = usePagination();
  const [status, setStatus] = useState<SellerApplicationStatus | ''>('');

  const { data, isLoading } = useSellerApplications({
    page: params.page,
    limit: params.limit,
    status: status || undefined,
  });

  const columns: Column<SellerApplication>[] = [
    {
      key: 'shop',
      header: 'Shop',
      render: (a) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-slate-900 dark:text-slate-100">
            {a.shop_name}
          </div>
          <div className="truncate text-xs text-slate-400 dark:text-slate-500">
            {a.business_name || 'Individual'} · {a.phone}
          </div>
        </div>
      ),
    },
    {
      key: 'applicant',
      header: 'Applicant',
      render: (a) => (
        <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
          #{a.user_id}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <ApplicationStatusBadge status={a.status} />,
    },
    {
      key: 'created',
      header: 'Submitted',
      render: (a) => (
        <span className="text-slate-500 dark:text-slate-400">
          {formatDate(a.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (a) => (
        <Link
          to={ROUTES.ADMIN_SELLER_APPLICATION_DETAIL(a.id)}
          className="inline-flex rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label="View details"
        >
          <Eye className="h-4 w-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Seller applications
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Approve or reject requests to become a seller.
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyIcon={Store}
        emptyTitle="No applications yet"
        emptyDescription="Seller applications will show up here."
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
                  setStatus(v as SellerApplicationStatus | '');
                  setPage(1);
                }}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
