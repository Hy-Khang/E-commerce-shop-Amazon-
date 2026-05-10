import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePagination } from '@/common/hooks/usePagination';
import { formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useAdminRoles } from '../hooks/useAdminRoles';
import { useToggleActivate } from '../hooks/useToggleActivate';
import { UserFilters } from '../components/UserFilters';
import { UserStatusBadge } from '../components/UserStatusBadge';
import type { AdminUserQueryParams } from '../types/admin.types';

export default function AdminUserListPage() {
  const { params, setPage, setSearchParams } = usePagination({
    sort: 'created_at',
    order: 'desc',
  });

  const [filters, setFilters] = useState<Pick<AdminUserQueryParams, 'search' | 'role' | 'is_active'>>({});

  const queryParams: AdminUserQueryParams = {
    ...params,
    ...filters,
  };

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

  function handleToggleActivate(userId: number) {
    toggleActivate.mutate(userId);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>

      <div className="mt-4">
        <UserFilters
          roles={roles ?? []}
          onFilterChange={handleFilterChange}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data?.data.map((user) => (
                <tr key={user.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {user.role.name}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <UserStatusBadge isActive={user.is_active} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link
                      to={ROUTES.ADMIN_USER_DETAIL(user.id)}
                      className="mr-3 text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleToggleActivate(user.id)}
                      disabled={toggleActivate.isPending}
                      className={`hover:underline disabled:opacity-50 ${
                        user.is_active ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {user.is_active ? 'Ban' : 'Unban'}
                    </button>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} users)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(data.meta.page - 1)}
              disabled={data.meta.page <= 1}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(data.meta.page + 1)}
              disabled={data.meta.page >= data.meta.totalPages}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
