import { z } from 'zod';
import type { PaginationParams } from '@/common/types/common.types';

// --- Enums ---

export type FlashSaleStatus = 'scheduled' | 'active' | 'ended';
export type FlashSaleRegistrationStatus = 'pending' | 'approved' | 'rejected';

// --- Response types ---

export interface FlashSaleItem {
  id: number;
  product_variant_id: number;
  flash_price: number;
  flash_quantity: number;
  sold_quantity: number;
  sold_percent: number;
  shop_id: number;
  shop_name?: string | null;
  status: FlashSaleRegistrationStatus;
  reject_reason?: string | null;
  product_id?: number | null;
  product_name?: string | null;
  product_slug?: string | null;
  thumbnail_url?: string | null;
  sku?: string | null;
  original_price?: number | null;
  variant_option1_label?: string | null;
  variant_option1_value?: string | null;
  variant_option2_label?: string | null;
  variant_option2_value?: string | null;
}

export interface FlashSale {
  id: number;
  name: string;
  registration_starts_at: string;
  registration_ends_at: string;
  starts_at: string;
  ends_at: string;
  min_discount_percent: number;
  status: FlashSaleStatus;
  is_active: boolean;
  item_count: number;
  pending_count: number;
  items: FlashSaleItem[];
  created_at: string;
  updated_at: string;
}

// --- Query params ---

export interface FlashSaleListParams extends PaginationParams {
  search?: string;
  status?: FlashSaleStatus;
  is_active?: boolean;
}

export interface FlashRegistrationListParams extends PaginationParams {
  status?: FlashSaleRegistrationStatus;
}

// --- Request types ---

export interface CreateFlashSaleRequest {
  name: string;
  registration_starts_at: string;
  registration_ends_at: string;
  starts_at: string;
  ends_at: string;
  min_discount_percent: number;
}

export interface UpdateFlashSaleRequest {
  name?: string;
  registration_starts_at?: string;
  registration_ends_at?: string;
  starts_at?: string;
  ends_at?: string;
  min_discount_percent?: number;
  is_active?: boolean;
}

export interface RegisterFlashSaleItemRequest {
  product_variant_id: number;
  flash_price: number;
  flash_quantity: number;
}

export interface UpdateFlashSaleItemRequest {
  flash_price?: number;
  flash_quantity?: number;
}

export interface ReviewFlashSaleItemRequest {
  reason?: string;
}

// --- Zod schemas (forms) ---

export const flashSaleFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(150),
    registration_starts_at: z.string().min(1, 'Registration start is required'),
    registration_ends_at: z.string().min(1, 'Registration deadline is required'),
    starts_at: z.string().min(1, 'Start date is required'),
    ends_at: z.string().min(1, 'End date is required'),
    min_discount_percent: z
      .number({ error: 'Minimum discount is required' })
      .min(0, 'Must be 0-100')
      .max(100, 'Must be 0-100'),
    is_active: z.boolean().optional(),
  })
  .refine((d) => new Date(d.registration_ends_at) > new Date(d.registration_starts_at), {
    message: 'Registration deadline must be after its start',
    path: ['registration_ends_at'],
  })
  .refine((d) => new Date(d.starts_at) >= new Date(d.registration_ends_at), {
    message: 'Sale must start on/after the registration deadline',
    path: ['starts_at'],
  })
  .refine((d) => new Date(d.ends_at) > new Date(d.starts_at), {
    message: 'End date must be after start date',
    path: ['ends_at'],
  });

export type FlashSaleFormData = z.infer<typeof flashSaleFormSchema>;

export const registerFlashSaleItemFormSchema = z.object({
  product_variant_id: z
    .number({ error: 'Variant is required' })
    .int()
    .positive('Select a variant'),
  flash_price: z.number({ error: 'Flash price is required' }).positive('Must be positive'),
  flash_quantity: z
    .number({ error: 'Quantity is required' })
    .int()
    .positive('Must be positive'),
});

export type RegisterFlashSaleItemFormData = z.infer<
  typeof registerFlashSaleItemFormSchema
>;
