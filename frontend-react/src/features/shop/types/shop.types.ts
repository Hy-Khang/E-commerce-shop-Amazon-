import { z } from 'zod';
import type { PaginationParams } from '@/common/types/common.types';
import type { DecorationConfig } from './decoration.types';

export type ShopStatus = 'pending_verification' | 'active' | 'suspended' | 'banned';

export interface Shop {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  /** Pickup point (Order Tracking origin). Seller-only; absent on public profiles. */
  pickup_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** Parsed storefront decoration (null = default layout). */
  decoration_config: DecorationConfig | null;
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
  pickup_address?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateShopRequest {
  name?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  pickup_address?: string;
  latitude?: number;
  longitude?: number;
  /** Save a decoration layout, or `null` to reset to the default. */
  decoration_config?: DecorationConfig | null;
}

const pickupFields = {
  pickup_address: z.string().max(255).optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
};

export const createShopSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(100),
  description: z.string().max(2000).optional().or(z.literal('')),
  logo_url: z.string().url().optional().or(z.literal('')),
  banner_url: z.string().url().optional().or(z.literal('')),
  ...pickupFields,
});

export type CreateShopFormData = z.infer<typeof createShopSchema>;

export const updateShopSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(100),
  description: z.string().max(2000).optional().or(z.literal('')),
  logo_url: z.string().url().optional().or(z.literal('')),
  banner_url: z.string().url().optional().or(z.literal('')),
  ...pickupFields,
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
