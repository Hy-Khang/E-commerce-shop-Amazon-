import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminRoleService } from '../services/admin.service';
import type { CreateRoleRequest, UpdateRoleRequest } from '../types/admin.types';

export const adminRoleKeys = {
  all: ['admin', 'roles'] as const,
};

export function useAdminRoles() {
  return useQuery({
    queryKey: adminRoleKeys.all,
    queryFn: () => adminRoleService.getAll(),
    select: (res) => res.data.data,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleRequest) => adminRoleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRoleKeys.all });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleRequest }) =>
      adminRoleService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRoleKeys.all });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminRoleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRoleKeys.all });
    },
  });
}
