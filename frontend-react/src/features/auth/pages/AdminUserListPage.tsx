import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Ban, ShieldCheck, CheckCircle } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { Button } from '@/common/components/ui/Button';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useAdminRoles } from '../hooks/useAdminRoles';
import { useToggleActivate } from '../hooks/useToggleActivate';
import { UserFilters } from '../components/UserFilters';
import { UserStatusBadge } from '../components/UserStatusBadge';
import type { AdminUserQueryParams, AdminUser } from '../types/admin.types';

export default function AdminUserListPage() {
  const { params, setPage } = usePagination({
    sort: 'created_at',
    order: 'desc',
  });

  const [filters, setFilters] = useState<Pick<AdminUserQueryParams, 'search' | 'role' | 'is_active'>>({});
  const [toggleTarget, setToggleTarget] = useState<AdminUser | null>(null);

  const queryParams: AdminUserQueryParams = { ...params, ...filters };

  const { data, isLoading } = useAdminUsers(queryParams);
  const { data: roles } = useAdminRoles();
  const toggleActivate = useToggleActivate();

  const handleFilterChange = useCallback(
    (newFilters: Partial<Pick<AdminUserQueryParams, 'search' | 'role' | 'is_active'>>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      setPage(1);
    },
    [setPage],
  );

  const handleToggleClick = (user: AdminUser) => {
    setToggleTarget(user);
  };

  const handleConfirmToggle = () => {
    if (toggleTarget) {
      toggleActivate.mutate(toggleTarget.id, {
        onSuccess: () => {
          setToggleTarget(null);
        },
      });
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">{user.full_name}</div>
          <div className="text-slate-500 dark:text-slate-400">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
          <ShieldCheck className="h-3 w-3 text-slate-400 dark:text-slate-500" />
          {user.role.name}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => <UserStatusBadge isActive={user.is_active} />,
    },
    {
      key: 'created',
      header: 'Created',
      render: (user) => <span className="text-slate-500 dark:text-slate-400">{formatDate(user.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (user) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to={ROUTES.ADMIN_USER_DETAIL(user.id)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="View user"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Button
            variant="ghost"
            iconOnly
            icon={user.is_active ? Ban : CheckCircle}
            aria-label={user.is_active ? 'Ban user' : 'Unban user'}
            onClick={() => handleToggleClick(user)}
            disabled={toggleActivate.isPending}
            className={user.is_active ? 'hover:!text-rose-600' : 'hover:!text-emerald-600'}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Users</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage user accounts and access</p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filter criteria."
        toolbar={
          <UserFilters
            roles={roles ?? []}
            onFilterChange={handleFilterChange}
          />
        }
      />

      <ConfirmModal
        open={toggleTarget !== null}
        title={toggleTarget?.is_active ? 'Ban User Account' : 'Activate User Account'}
        message={
          toggleTarget?.is_active
            ? `Are you sure you want to ban ${toggleTarget?.full_name}? They will immediately lose access to all portal features.`
            : `Are you sure you want to activate the account for ${toggleTarget?.full_name}? They will gain immediate access to portal features.`
        }
        variant={toggleTarget?.is_active ? 'danger' : 'info'}
        confirmVariant={toggleTarget?.is_active ? 'danger' : 'primary'}
        confirmLabel={toggleTarget?.is_active ? 'Ban Account' : 'Activate'}
        loading={toggleActivate.isPending}
        onConfirm={handleConfirmToggle}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
}

