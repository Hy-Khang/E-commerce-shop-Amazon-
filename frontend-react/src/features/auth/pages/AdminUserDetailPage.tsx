import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';
import { useAdminUser } from '../hooks/useAdminUser';
import { useAdminRoles } from '../hooks/useAdminRoles';
import { useToggleActivate } from '../hooks/useToggleActivate';
import { useChangeUserRole } from '../hooks/useChangeUserRole';
import { UserStatusBadge } from '../components/UserStatusBadge';

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);

  const { data: user, isLoading } = useAdminUser(userId);
  const { data: roles } = useAdminRoles();
  const toggleActivate = useToggleActivate();
  const changeRole = useChangeUserRole();

  function handleToggleActivate() {
    toggleActivate.mutate(userId);
  }

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const roleId = Number(e.target.value);
    if (roleId) {
      changeRole.mutate({ id: userId, data: { role_id: roleId } });
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-slate-500">User not found.</div>;
  }

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.ADMIN_USERS}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-700">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{user.full_name}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <UserStatusBadge isActive={user.is_active} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="admin-card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Full Name</dt>
              <dd className="text-sm font-medium text-slate-900">{user.full_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Email</dt>
              <dd className="text-sm font-medium text-slate-900">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Phone</dt>
              <dd className="text-sm font-medium text-slate-900">{user.phone ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Created</dt>
              <dd className="text-sm font-medium text-slate-900">{formatDate(user.created_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Updated</dt>
              <dd className="text-sm font-medium text-slate-900">{formatDate(user.updated_at)}</dd>
            </div>
          </dl>
        </div>

        <div className="admin-card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Statistics</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Orders</dt>
              <dd className="text-2xl font-bold text-slate-900">{user.orderCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Reviews</dt>
              <dd className="text-2xl font-bold text-slate-900">{user.reviewCount}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="admin-card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Admin Actions</h2>

        <div className="mt-4 flex flex-wrap items-end gap-6">
          <div>
            <label htmlFor="user-role" className="block text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="user-role"
              value={user.role.id ?? ''}
              onChange={handleRoleChange}
              disabled={changeRole.isPending}
              className="admin-input mt-1 w-40"
            >
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant={user.is_active ? 'danger' : 'primary'}
            onClick={handleToggleActivate}
            loading={toggleActivate.isPending}
          >
            {user.is_active ? 'Ban User' : 'Unban User'}
          </Button>
        </div>
      </div>
    </div>
  );
}
