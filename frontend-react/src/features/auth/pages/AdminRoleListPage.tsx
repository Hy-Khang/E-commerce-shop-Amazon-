import { useState } from 'react';
import { Pencil, Trash2, Plus, Shield } from 'lucide-react';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { Button } from '@/common/components/ui/Button';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
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
  const [deleteTarget, setDeleteTarget] = useState<RoleWithUserCount | null>(null);

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

  function confirmDelete() {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    }
  }

  const columns: Column<RoleWithUserCount>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (role) => <span className="font-mono text-slate-500">{role.id}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (role) => <span className="font-medium text-slate-900">{role.name}</span>,
    },
    {
      key: 'users',
      header: 'Users',
      render: (role) => <span className="text-slate-500">{role.userCount}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (role) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            iconOnly
            icon={Pencil}
            aria-label="Edit role"
            onClick={() => handleEdit(role)}
          />
          <Button
            variant="ghost"
            iconOnly
            icon={Trash2}
            aria-label="Delete role"
            onClick={() => setDeleteTarget(role)}
            disabled={deleteMutation.isPending}
            className="hover:!text-rose-600"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Roles</h1>
          <p className="mt-1 text-sm text-slate-500">Manage user roles and access levels</p>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Create Role
        </Button>
      </div>

      <AdminDataTable
        columns={columns}
        data={roles}
        isLoading={isLoading}
        emptyIcon={Shield}
        emptyTitle="No roles found"
        emptyDescription="Create a role to get started."
      />

      <RoleFormModal
        role={editingRole}
        isOpen={isModalOpen}
        isPending={editingRole ? updateMutation.isPending : createMutation.isPending}
        error={editingRole ? updateMutation.error : createMutation.error}
        onSubmit={handleSubmit}
        onClose={() => setIsModalOpen(false)}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Role"
        message={`Delete role "${deleteTarget?.name}"? This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
