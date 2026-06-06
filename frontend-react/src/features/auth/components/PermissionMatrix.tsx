import { useState, useCallback, useEffect } from 'react';
import { Shield, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import type { Permission, PermissionsByResource, RoleWithUserCount } from '../types/admin.types';

const ACTION_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  create: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  read: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  update: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  delete: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
};

const RESOURCE_ICONS: Record<string, string> = {
  products: 'P',
  categories: 'C',
  orders: 'O',
  users: 'U',
  roles: 'R',
  permissions: 'K',
  reviews: 'V',
  coupons: '$',
  wishlist: 'W',
  uploads: 'F',
  dashboard: 'D',
};

function getActionColor(action: string) {
  return ACTION_COLORS[action] ?? { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' };
}

interface Props {
  grouped: PermissionsByResource;
  roles: RoleWithUserCount[];
  rolePermissionSets: Map<number, Set<number>>;
  pendingRoleId: number | null;
  onToggle: (roleId: number, permissionId: number, granted: boolean) => void;
}

export function PermissionMatrix({ grouped, roles, rolePermissionSets, pendingRoleId, onToggle }: Props) {
  const resources = Object.keys(grouped).sort();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = useCallback((resource: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(resource)) next.delete(resource);
      else next.add(resource);
      return next;
    });
  }, []);

  const isGranted = useCallback(
    (roleId: number, permissionId: number) => {
      return rolePermissionSets.get(roleId)?.has(permissionId) ?? false;
    },
    [rolePermissionSets],
  );

  const resourceTotalGranted = useCallback(
    (roleId: number, permissions: Permission[]) => {
      const set = rolePermissionSets.get(roleId);
      if (!set) return 0;
      return permissions.filter((p) => set.has(p.id)).length;
    },
    [rolePermissionSets],
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[260px] border-b-2 border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Resource / Action
            </th>
            {roles.map((role) => (
              <th
                key={role.id}
                className="min-w-[120px] border-b-2 border-slate-200 bg-slate-50 px-3 py-3 text-center"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {role.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {role.userCount} user{role.userCount !== 1 ? 's' : ''}
                  </span>
                  {role.is_system && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                      <Shield className="h-2.5 w-2.5" />
                      system
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {resources.map((resource) => {
            const permissions = grouped[resource];
            const isCollapsed = collapsed.has(resource);
            const icon = RESOURCE_ICONS[resource] ?? resource[0].toUpperCase();

            return (
              <ResourceGroup
                key={resource}
                resource={resource}
                icon={icon}
                permissions={permissions}
                roles={roles}
                isCollapsed={isCollapsed}
                pendingRoleId={pendingRoleId}
                onToggleCollapse={() => toggleCollapse(resource)}
                isGranted={isGranted}
                onToggle={onToggle}
                resourceTotalGranted={resourceTotalGranted}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface ResourceGroupProps {
  resource: string;
  icon: string;
  permissions: Permission[];
  roles: RoleWithUserCount[];
  isCollapsed: boolean;
  pendingRoleId: number | null;
  onToggleCollapse: () => void;
  isGranted: (roleId: number, permissionId: number) => boolean;
  onToggle: (roleId: number, permissionId: number, granted: boolean) => void;
  resourceTotalGranted: (roleId: number, permissions: Permission[]) => number;
}

function ResourceGroup({
  resource,
  icon,
  permissions,
  roles,
  isCollapsed,
  pendingRoleId,
  onToggleCollapse,
  isGranted,
  onToggle,
  resourceTotalGranted,
}: ResourceGroupProps) {
  const sortedPermissions = [...permissions].sort((a, b) => {
    const order = ['create', 'read', 'update', 'delete'];
    return (order.indexOf(a.action) === -1 ? 99 : order.indexOf(a.action)) -
      (order.indexOf(b.action) === -1 ? 99 : order.indexOf(b.action));
  });

  return (
    <>
      <tr
        className="group cursor-pointer select-none border-t border-slate-100 hover:bg-slate-50/80 transition-colors"
        onClick={onToggleCollapse}
      >
        <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
              {icon}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold capitalize text-slate-900">{resource}</span>
              <span className="text-[11px] text-slate-400">
                {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="ml-auto text-slate-400 transition-transform">
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </td>
        {roles.map((role) => {
          const granted = resourceTotalGranted(role.id, permissions);
          return (
            <td key={role.id} className="px-3 py-3 text-center">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  granted === permissions.length
                    ? 'bg-emerald-100 text-emerald-700'
                    : granted > 0
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {granted}/{permissions.length}
              </span>
            </td>
          );
        })}
      </tr>

      {!isCollapsed &&
        sortedPermissions.map((permission) => {
          const color = getActionColor(permission.action);
          return (
            <tr
              key={permission.id}
              className="border-t border-slate-50 transition-colors hover:bg-slate-50/50"
            >
              <td className="sticky left-0 z-10 bg-white py-2.5 pl-16 pr-4 hover:bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${color.bg} ${color.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
                    {permission.action}
                  </span>
                  <span className="text-xs text-slate-400">{permission.name}</span>
                </div>
              </td>
              {roles.map((role) => {
                const granted = isGranted(role.id, permission.id);
                const isPending = pendingRoleId === role.id;
                return (
                  <td key={role.id} className="px-3 py-2.5 text-center">
                    <ToggleCheckbox
                      checked={granted}
                      disabled={isPending}
                      onChange={() => onToggle(role.id, permission.id, granted)}
                    />
                  </td>
                );
              })}
            </tr>
          );
        })}
    </>
  );
}

interface ToggleCheckboxProps {
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}

function ToggleCheckbox({ checked, disabled, onChange }: ToggleCheckboxProps) {
  const [optimistic, setOptimistic] = useState(checked);

  useEffect(() => {
    setOptimistic(checked);
  }, [checked]);

  function handleClick() {
    if (disabled) return;
    setOptimistic(!optimistic);
    onChange();
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`
        relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full
        transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2
        focus-visible:ring-teal-500 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${optimistic ? 'bg-emerald-500' : 'bg-slate-300'}
      `}
    >
      <span
        className={`
          inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm
          transition-transform duration-200 ease-in-out
          ${optimistic ? 'translate-x-[18px]' : 'translate-x-[3px]'}
        `}
      />
    </button>
  );
}
