import { z } from 'zod';
import type { PaginationParams } from '@/common/types/common.types';

export type ShopStatus = 'pending_verification' | 'active' | 'suspended' | 'banned';

export interface Shop {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  status: ShopStatus;
  created_at: string;
  updated_at: string;
}

export interface ShopProfile extends Shop {
  product_count: number;
  average_rating: number;
  total_sales: number;
}

export interface AdminShop extends Shop {
  verified_at: string | null;
  verified_by: number | null;
  suspended_at: string | null;
  banned_at: string | null;
}

export interface ShopListParams extends PaginationParams {
  search?: string;
}

export interface CreateShopRequest {
  name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
}

export interface UpdateShopRequest {
  name?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
}

export const createShopSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(100),
  description: z.string().max(2000).optional().or(z.literal('')),
  logo_url: z.string().url().optional().or(z.literal('')),
  banner_url: z.string().url().optional().or(z.literal('')),
});

export type CreateShopFormData = z.infer<typeof createShopSchema>;

export const updateShopSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(100),
  description: z.string().max(2000).optional().or(z.literal('')),
  logo_url: z.string().url().optional().or(z.literal('')),
  banner_url: z.string().url().optional().or(z.literal('')),
});

export type UpdateShopFormData = z.infer<typeof updateShopSchema>;

export interface AdminShopQueryParams extends PaginationParams {
  search?: string;
  status?: ShopStatus | '';
}

export const SHOP_STATUS_LABELS: Record<ShopStatus, string> = {
  pending_verification: 'Pending Verification',
  active: 'Active',
  suspended: 'Suspended',
  banned: 'Banned',
};
