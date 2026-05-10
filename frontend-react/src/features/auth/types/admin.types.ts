import { z } from 'zod';

export interface Role {
  id: number;
  name: string;
}

export interface RoleWithUserCount extends Role {
  userCount: number;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface AdminUserDetail extends AdminUser {
  orderCount: number;
  reviewCount: number;
}

export interface AdminUserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  is_active?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface UpdateUserRoleRequest {
  role_id: number;
}

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50),
});

export type CreateRoleRequest = z.infer<typeof createRoleSchema>;

export interface UpdateRoleRequest {
  name?: string;
}
