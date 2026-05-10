import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type {
  RoleWithUserCount,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  AdminUser,
  AdminUserDetail,
  AdminUserQueryParams,
  UpdateUserRoleRequest,
} from '../types/admin.types';

export const adminRoleService = {
  getAll: () =>
    api.get<SuccessResponse<RoleWithUserCount[]>>('/admin/roles'),

  getById: (id: number) =>
    api.get<SuccessResponse<RoleWithUserCount>>(`/admin/roles/${id}`),

  create: (data: CreateRoleRequest) =>
    api.post<SuccessResponse<Role>>('/admin/roles', data),

  update: (id: number, data: UpdateRoleRequest) =>
    api.patch<SuccessResponse<Role>>(`/admin/roles/${id}`, data),

  delete: (id: number) =>
    api.delete(`/admin/roles/${id}`),
};

export const adminUserService = {
  getAll: (params: AdminUserQueryParams) =>
    api.get<PaginatedResponse<AdminUser>>('/admin/users', { params }),

  getById: (id: number) =>
    api.get<SuccessResponse<AdminUserDetail>>(`/admin/users/${id}`),

  toggleActivate: (id: number) =>
    api.patch<SuccessResponse<AdminUser>>(`/admin/users/${id}/activate`),

  changeRole: (id: number, data: UpdateUserRoleRequest) =>
    api.patch<SuccessResponse<AdminUser>>(`/admin/users/${id}/role`, data),
};
