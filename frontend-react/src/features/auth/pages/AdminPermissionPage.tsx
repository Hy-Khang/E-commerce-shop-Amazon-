import { useState, useEffect, useCallback, useMemo } from 'react';
import { Shield, Plus, Trash2, Pencil, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PermissionMatrix } from '../components/PermissionMatrix';
import {
  useAdminPermissions,
  useRolePermissions,
  useSyncRolePermissions,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
} from '../hooks/useAdminPermissions';
import { useAdminRoles } from '../hooks/useAdminRoles';
import type {
  Permission,
  RoleWithUserCount,
  CreatePermissionRequest,
  UpdatePermissionRequest,
} from '../types/admin.types';
import { ApiError } from '@/core/api/api.types';

type TabId = 'matrix' | 'manage';

export default function AdminPermissionPage() {
  const [activeTab, setActiveTab] = useState<TabId>('matrix');

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage role-based access control across the platform
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex gap-1 border-b border-gray-200">
          <TabButton
            active={activeTab === 'matrix'}
            onClick={() => setActiveTab('matrix')}
            label="Permission Matrix"
          />
          <TabButton
            active={activeTab === 'manage'}
            onClick={() => setActiveTab('manage')}
            label="Manage Permissions"
          />
        </div>

        <div className="mt-6">
          {activeTab === 'matrix' && <MatrixTab />}
          {activeTab === 'manage' && <ManageTab />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        border-b-2 px-4 py-2.5 text-sm font-medium transition-colors
        ${active
          ? 'border-gray-900 text-gray-900'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }
      `}
    >
      {label}
    </button>
  );
}

function MatrixTab() {
  const { data: permissionData, isLoading: permLoading } = useAdminPermissions();
  const { data: roles, isLoading: rolesLoading } = useAdminRoles();
  const syncMutation = useSyncRolePermissions();

  const safeRoles = useMemo(() => roles ?? [], [roles]);

  const rolePermQueries = useMemo(() => {
    return safeRoles.map((r) => r.id);
  }, [safeRoles]);

  const [rolePermSets, setRolePermSets] = useState<Map<number, Set<number>>>(new Map());
  const [pendingRoleId, setPendingRoleId] = useState<number | null>(null);

  const role1Query = useRolePermissions(rolePermQueries[0] ?? 0);
  const role2Query = useRolePermissions(rolePermQueries[1] ?? 0);
  const role3Query = useRolePermissions(rolePermQueries[2] ?? 0);
  const role4Query = useRolePermissions(rolePermQueries[3] ?? 0);
  const role5Query = useRolePermissions(rolePermQueries[4] ?? 0);

  const roleQueryMap = useMemo(() => {
    const queries = [role1Query, role2Query, role3Query, role4Query, role5Query];
    const map = new Map<number, Set<number>>();
    rolePermQueries.forEach((roleId, i) => {
      if (roleId && queries[i]?.data) {
        map.set(roleId, queries[i].data!);
      }
    });
    return map;
  }, [rolePermQueries, role1Query.data, role2Query.data, role3Query.data, role4Query.data, role5Query.data]);

  useEffect(() => {
    setRolePermSets(roleQueryMap);
  }, [roleQueryMap]);

  const handleToggle = useCallback(
    (roleId: number, permissionId: number, currentlyGranted: boolean) => {
      const current = rolePermSets.get(roleId);
      if (!current) return;

      const next = new Set(current);
      if (currentlyGranted) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }

      setRolePermSets((prev) => {
        const updated = new Map(prev);
        updated.set(roleId, next);
        return updated;
      });

      setPendingRoleId(roleId);
      syncMutation.mutate(
        { roleId, data: { permission_ids: Array.from(next) } },
        {
          onSuccess: () => {
            setPendingRoleId(null);
            toast.success('Permissions updated');
          },
          onError: (err) => {
            setPendingRoleId(null);
            setRolePermSets((prev) => {
              const reverted = new Map(prev);
              reverted.set(roleId, current);
              return reverted;
            });
            toast.error(err instanceof ApiError ? err.message : 'Failed to update permissions');
          },
        },
      );
    },
    [rolePermSets, syncMutation],
  );

  if (permLoading || rolesLoading) {
    return <MatrixSkeleton />;
  }

  if (!permissionData || !roles || roles.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 px-6 py-12 text-center">
        <Shield className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">No permissions or roles found. Run database seeds first.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <PermissionMatrix
        grouped={permissionData.grouped}
        roles={roles}
        rolePermissionSets={rolePermSets}
        pendingRoleId={pendingRoleId}
        onToggle={handleToggle}
      />
    </div>
  );
}

function ManageTab() {
  const { data: permissionData, isLoading } = useAdminPermissions();
  const createMutation = useCreatePermission();
  const updateMutation = useUpdatePermission();
  const deleteMutation = useDeletePermission();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  function handleCreate(data: CreatePermissionRequest) {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowCreateForm(false);
        toast.success('Permission created');
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : 'Failed to create permission');
      },
    });
  }

  function handleUpdate(id: number, data: UpdatePermissionRequest) {
    updateMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          setEditingPermission(null);
          toast.success('Permission updated');
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : 'Failed to update permission');
        },
      },
    );
  }

  function handleDelete(permission: Permission) {
    if (!confirm(`Delete "${permission.resource}:${permission.action}"? This cannot be undone.`)) return;
    deleteMutation.mutate(permission.id, {
      onSuccess: () => toast.success('Permission deleted'),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : 'Failed to delete permission'),
    });
  }

  if (isLoading) {
    return <ManageSkeleton />;
  }

  const grouped = permissionData?.grouped ?? {};
  const resources = Object.keys(grouped).sort();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {permissionData?.flat.length ?? 0} permissions across {resources.length} resources
        </p>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Permission
        </button>
      </div>

      {showCreateForm && (
        <PermissionForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
          isPending={createMutation.isPending}
        />
      )}

      <div className="space-y-4">
        {resources.map((resource) => (
          <div key={resource} className="overflow-hidden rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-900 text-[10px] font-bold text-white">
                {resource[0].toUpperCase()}
              </span>
              <span className="text-sm font-semibold capitalize text-gray-900">{resource}</span>
              <span className="text-xs text-gray-400">({grouped[resource].length})</span>
            </div>
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {grouped[resource]
                  .sort((a, b) => a.action.localeCompare(b.action))
                  .map((permission) => (
                    <tr key={permission.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5">
                        <ActionBadge action={permission.action} />
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                        {permission.name}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-400">
                        {permission.description ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {editingPermission?.id === permission.id ? (
                            <InlineEditForm
                              permission={permission}
                              onSubmit={(data) => handleUpdate(permission.id, data)}
                              onCancel={() => setEditingPermission(null)}
                              isPending={updateMutation.isPending}
                            />
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingPermission(permission)}
                                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(permission)}
                                disabled={deleteMutation.isPending}
                                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    create: 'bg-emerald-50 text-emerald-700',
    read: 'bg-sky-50 text-sky-700',
    update: 'bg-amber-50 text-amber-700',
    delete: 'bg-rose-50 text-rose-700',
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors[action] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {action}
    </span>
  );
}

function PermissionForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (data: CreatePermissionRequest) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');
  const [description, setDescription] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !resource.trim() || !action.trim()) return;
    onSubmit({
      name: name.trim(),
      resource: resource.trim().toLowerCase(),
      action: action.trim().toLowerCase(),
      description: description.trim() || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      <div className="grid grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Name (e.g. Create Product)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          required
        />
        <input
          type="text"
          placeholder="Resource (e.g. products)"
          value={resource}
          onChange={(e) => setResource(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          required
        />
        <input
          type="text"
          placeholder="Action (e.g. create)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          required
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? 'Creating...' : 'Create'}
        </button>
      </div>
    </form>
  );
}

function InlineEditForm({
  permission,
  onSubmit,
  onCancel,
  isPending,
}: {
  permission: Permission;
  onSubmit: (data: UpdatePermissionRequest) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(permission.name);
  const [description, setDescription] = useState(permission.description ?? '');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name: name.trim(), description: description.trim() || undefined });
      }}
      className="flex items-center gap-2"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-36 rounded border border-gray-300 px-2 py-1 text-xs focus:border-gray-500 focus:outline-none"
        required
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="description"
        className="w-36 rounded border border-gray-300 px-2 py-1 text-xs focus:border-gray-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-gray-800 disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded p-1 text-gray-400 hover:text-gray-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

function MatrixSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="animate-pulse">
        <div className="flex border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="ml-auto flex gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-20 rounded bg-gray-200" />
            ))}
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex border-t border-gray-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-200" />
            </div>
            <div className="ml-auto flex gap-8">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-5 w-14 rounded-full bg-gray-200" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-48 rounded bg-gray-200" />
        <div className="h-9 w-32 rounded-md bg-gray-200" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-gray-200">
          <div className="bg-gray-50 px-4 py-2.5">
            <div className="h-4 w-24 rounded bg-gray-200" />
          </div>
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-4 w-full rounded bg-gray-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
