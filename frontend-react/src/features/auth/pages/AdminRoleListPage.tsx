import { useState } from 'react';
import { useAdminRoles, useCreateRole, useUpdateRole, useDeleteRole } from '../hooks/useAdminRoles';
import { RoleFormModal } from '../components/RoleFormModal';
import type { RoleWithUserCount, CreateRoleRequest } from '../types/admin.types';

export default function AdminRoleListPage() {
  const { data: roles, isLoading } = useAdminRoles();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithUserCount | null>(null);

  function handleCreate() {
    setEditingRole(null);
    setIsModalOpen(true);
  }

  function handleEdit(role: RoleWithUserCount) {
    setEditingRole(role);
    setIsModalOpen(true);
  }

  function handleSubmit(data: CreateRoleRequest) {
    if (editingRole) {
      updateMutation.mutate(
        { id: editingRole.id, data },
        { onSuccess: () => setIsModalOpen(false) },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  }

  function handleDelete(role: RoleWithUserCount) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(role.id);
  }

  if (isLoading) {
    return <div className="text-gray-500">Loading roles...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
        <button
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Role
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Users
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {roles?.map((role) => (
              <tr key={role.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {role.id}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {role.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {role.userCount}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <button
                    onClick={() => handleEdit(role)}
                    className="mr-3 text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {roles?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                  No roles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <RoleFormModal
        role={editingRole}
        isOpen={isModalOpen}
        isPending={editingRole ? updateMutation.isPending : createMutation.isPending}
        error={editingRole ? updateMutation.error : createMutation.error}
        onSubmit={handleSubmit}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
