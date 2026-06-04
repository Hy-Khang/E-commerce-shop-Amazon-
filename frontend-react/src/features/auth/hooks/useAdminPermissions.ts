import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminPermissionService } from '../services/admin.service';
import type {
  CreatePermissionRequest,
  UpdatePermissionRequest,
  AssignPermissionsRequest,
  PermissionsByResource,
} from '../types/admin.types';
import { adminRoleKeys } from './useAdminRoles';

export const adminPermissionKeys = {
  all: ['admin', 'permissions'] as const,
  rolePermissions: (roleId: number) => ['admin', 'roles', roleId, 'permissions'] as const,
};

export function useAdminPermissions() {
  return useQuery({
    queryKey: adminPermissionKeys.all,
    queryFn: () => adminPermissionService.getAll(),
    select: (res) => {
      const permissions = res.data.data;
      const grouped: PermissionsByResource = {};
      for (const p of permissions) {
        if (!grouped[p.resource]) grouped[p.resource] = [];
        grouped[p.resource].push(p);
      }
      return { flat: permissions, grouped };
    },
  });
}

export function useRolePermissions(roleId: number) {
  return useQuery({
    queryKey: adminPermissionKeys.rolePermissions(roleId),
    queryFn: () => adminPermissionService.getRolePermissions(roleId),
    select: (res) => {
      const permissions = res.data.data;
      return new Set(permissions.map((p) => p.id));
    },
    enabled: roleId > 0,
  });
}

export function useSyncRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: number; data: AssignPermissionsRequest }) =>
      adminPermissionService.syncRolePermissions(roleId, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminPermissionKeys.rolePermissions(variables.roleId),
      });
    },
  });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePermissionRequest) => adminPermissionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPermissionKeys.all });
    },
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePermissionRequest }) =>
      adminPermissionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPermissionKeys.all });
    },
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminPermissionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPermissionKeys.all });
      queryClient.invalidateQueries({ queryKey: adminRoleKeys.all });
    },
  });
}
