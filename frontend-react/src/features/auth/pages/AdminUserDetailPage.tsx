import { useParams, Link } from 'react-router-dom';
import { formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
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
    return <div className="text-gray-500">Loading user...</div>;
  }

  if (!user) {
    return <div className="text-gray-500">User not found.</div>;
  }

  const currentRoleId = user.role.id;

  return (
    <div>
      <div className="mb-4">
        <Link to={ROUTES.ADMIN_USERS} className="text-sm text-blue-600 hover:underline">
          &larr; Back to Users
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>
        <UserStatusBadge isActive={user.is_active} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Full Name</dt>
              <dd className="text-sm font-medium text-gray-900">{user.full_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="text-sm font-medium text-gray-900">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Phone</dt>
              <dd className="text-sm font-medium text-gray-900">{user.phone ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Created</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDate(user.created_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Updated</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDate(user.updated_at)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Statistics</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Orders</dt>
              <dd className="text-sm font-medium text-gray-900">{user.orderCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Reviews</dt>
              <dd className="text-sm font-medium text-gray-900">{user.reviewCount}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Admin Actions</h2>

        <div className="mt-4 flex flex-wrap items-end gap-6">
          <div>
            <label htmlFor="user-role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="user-role"
              value={currentRoleId ?? ''}
              onChange={handleRoleChange}
              disabled={changeRole.isPending}
              className="mt-1 w-40 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleToggleActivate}
            disabled={toggleActivate.isPending}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              user.is_active
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {toggleActivate.isPending
              ? 'Processing...'
              : user.is_active
                ? 'Ban User'
                : 'Unban User'}
          </button>
        </div>
      </div>
    </div>
  );
}
