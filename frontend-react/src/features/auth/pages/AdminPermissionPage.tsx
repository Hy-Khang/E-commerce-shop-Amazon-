import { useState, useCallback, useMemo } from 'react';
import { Shield, Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/common/components/ui/Button';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { PermissionMatrix } from '../components/PermissionMatrix';
import { PermissionFormModal } from '../components/PermissionFormModal';
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Permissions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage role-based access control across the platform
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex gap-1 border-b border-slate-200">
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
          ? 'border-teal-600 text-teal-600'
          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
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
    // Intentionally keyed on each query's `data` (stable react-query refs) — depending
    // on the query objects themselves would rebuild the map on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolePermQueries, role1Query.data, role2Query.data, role3Query.data, role4Query.data, role5Query.data]);

  // Local (optimistic) copy of the server permission sets. Initialised FROM roleQueryMap
  // so a cached SPA navigation — where roleQueryMap already holds data on the first render —
  // shows the toggles immediately instead of an empty 0/N grid until reload.
  const [rolePermSets, setRolePermSets] = useState<Map<number, Set<number>>>(roleQueryMap);
  const [pendingRoleId, setPendingRoleId] = useState<number | null>(null);

  // Sync server-derived permissions into local state without an effect, via React's
  // "adjust state during render" pattern (re-renders immediately, no cascade). Must init
  // syncedMap from the SAME roleQueryMap as rolePermSets, otherwise the two disagree on the
  // first render and the reconcile never runs (that was the cached-navigation 0/N bug).
  const [syncedMap, setSyncedMap] = useState(roleQueryMap);
  if (syncedMap !== roleQueryMap) {
    setSyncedMap(roleQueryMap);
    setRolePermSets(roleQueryMap);
  }

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
      <div className="admin-card px-6 py-12 text-center">
        <Shield className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">No permissions or roles found. Run database seeds first.</p>
      </div>
    );
  }

  return (
    <div className="admin-card overflow-hidden">
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
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);

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

  function handleUpdate(data: UpdatePermissionRequest) {
    if (!editingPermission) return;
    updateMutation.mutate(
      { id: editingPermission.id, data },
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

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success('Permission deleted');
      },
      onError: (err) => {
        setDeleteTarget(null);
        toast.error(err instanceof ApiError ? err.message : 'Failed to delete permission');
      },
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
        <p className="text-sm text-slate-500">
          {permissionData?.flat.length ?? 0} permissions across {resources.length} resources
        </p>
        <Button icon={Plus} onClick={() => setShowCreateForm(true)}>
          Add Permission
        </Button>
      </div>

      <div className="space-y-4">
        {resources.map((resource) => (
          <div key={resource} className="admin-card overflow-hidden">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-[10px] font-bold text-white">
                {resource[0].toUpperCase()}
              </span>
              <span className="text-sm font-semibold capitalize text-slate-900">{resource}</span>
              <span className="text-xs text-slate-400">({grouped[resource].length})</span>
            </div>
            <table className="w-full">
              <tbody className="divide-y divide-slate-100">
                {grouped[resource]
                  .sort((a, b) => a.action.localeCompare(b.action))
                  .map((permission) => (
                    <tr key={permission.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <ActionBadge action={permission.action} />
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-900">
                        {permission.name}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">
                        {permission.description ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingPermission(permission)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            aria-label="Edit permission"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(permission)}
                            disabled={deleteMutation.isPending}
                            className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 transition-colors"
                            aria-label="Delete permission"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <PermissionFormModal
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        isPending={createMutation.isPending}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <PermissionFormModal
        open={editingPermission !== null}
        onClose={() => setEditingPermission(null)}
        permission={editingPermission}
        isPending={updateMutation.isPending}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Permission"
        message={deleteTarget
          ? `Delete "${deleteTarget.resource}:${deleteTarget.action}"? This cannot be undone.`
          : ''}
        variant="danger"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
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
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors[action] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {action}
    </span>
  );
}

function MatrixSkeleton() {
  return (
    <div className="admin-card overflow-hidden">
      <div className="animate-pulse">
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="ml-auto flex gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-20 rounded bg-slate-200" />
            ))}
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex border-t border-slate-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-slate-200" />
              <div className="h-4 w-24 rounded bg-slate-200" />
            </div>
            <div className="ml-auto flex gap-8">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-5 w-14 rounded-full bg-slate-200" />
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
        <div className="h-4 w-48 rounded bg-slate-200" />
        <div className="h-9 w-32 rounded-md bg-slate-200" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="admin-card overflow-hidden">
          <div className="bg-slate-50 px-4 py-2.5">
            <div className="h-4 w-24 rounded bg-slate-200" />
          </div>
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-4 w-full rounded bg-slate-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
