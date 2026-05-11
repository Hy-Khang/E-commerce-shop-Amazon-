import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCategoryService } from '../services/admin-product.service';
import { categoryKeys } from './useCategories';
import type { AdminCategoryListParams, CreateCategoryRequest, UpdateCategoryRequest } from '../types/product.types';

export const adminCategoryKeys = {
  all: ['admin', 'categories'] as const,
  list: (params: AdminCategoryListParams) => ['admin', 'categories', 'list', params] as const,
  detail: (id: number) => ['admin', 'categories', 'detail', id] as const,
};

export function useAdminCategories(params: AdminCategoryListParams) {
  return useQuery({
    queryKey: adminCategoryKeys.list(params),
    queryFn: () => adminCategoryService.getList(params),
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}

export function useAdminCategory(id: number) {
  return useQuery({
    queryKey: adminCategoryKeys.detail(id),
    queryFn: () => adminCategoryService.getById(id),
    select: (res) => res.data.data,
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => adminCategoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryRequest }) =>
      adminCategoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminCategoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
