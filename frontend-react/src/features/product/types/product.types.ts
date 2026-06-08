import { z } from 'zod';
import type { PaginationParams } from '@/common/types/common.types';

// --- Response types ---

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  children?: Category[];
}

export interface AdminCategory extends Category {
  productCount: number;
  parent?: Category | null;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  sort_order: number;
  variant_option1: string | null;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  option1: string | null;
  option2: string | null;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
}

export interface ShopSummary {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface Product {
  id: number;
  category_id: number;
  shop_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  option1_label: string | null;
  option2_label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
  images: ProductImage[];
  shop?: ShopSummary;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  thumbnail_url: string | null;
  option1_label: string | null;
  option2_label: string | null;
  is_active: boolean;
  created_at: string;
  category_id: number;
  variants: ProductVariant[];
}

export interface AdminProductDetail extends Product {
  review_count?: number;
  average_rating?: number;
}

export interface CategoryDetail {
  category: Category;
  products: {
    data: ProductListItem[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// --- Query params ---

export interface ProductListParams extends PaginationParams {
  category_id?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
  is_active?: boolean;
}

export interface AdminProductListParams extends PaginationParams {
  category_id?: number;
  search?: string;
  is_active?: boolean;
}

export interface AdminCategoryListParams extends PaginationParams {
  search?: string;
  parent_id?: number;
}

// --- Request types ---

export interface CreateProductRequest {
  name: string;
  slug: string;
  category_id: number;
  description?: string;
  thumbnail_url?: string;
  option1_label?: string;
  option2_label?: string;
}

export interface UpdateProductRequest {
  name?: string;
  slug?: string;
  category_id?: number;
  description?: string;
  thumbnail_url?: string;
  option1_label?: string;
  option2_label?: string;
}

export interface CreateVariantRequest {
  sku: string;
  option1?: string;
  option2?: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
}

export interface UpdateVariantRequest {
  option1?: string;
  option2?: string;
  price?: number;
  sale_price?: number | null;
  stock_quantity?: number;
}

export interface CreateImageRequest {
  image_url: string;
  sort_order?: number;
  variant_option1?: string;
}

export interface UpdateImageRequest {
  sort_order?: number;
  variant_option1?: string | null;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  parent_id?: number | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  parent_id?: number | null;
}

// --- Zod schemas (forms) ---

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  slug: z.string().min(1, 'Slug is required').max(255),
  category_id: z.number({ error: 'Category is required' }).int().positive(),
  description: z.string().optional(),
  thumbnail_url: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        if (/^\/uploads\/products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(val)) return true;
        try { const u = new URL(val); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
      },
      'Must be a valid image URL or uploaded image',
    )
    .optional()
    .or(z.literal('')),
  option1_label: z.string().max(50).optional().or(z.literal('')),
  option2_label: z.string().max(50).optional().or(z.literal('')),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;

export const createVariantSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50),
  option1: z.string().max(50).optional().or(z.literal('')),
  option2: z.string().max(50).optional().or(z.literal('')),
  price: z.number({ error: 'Price is required' }).positive('Price must be positive'),
  sale_price: z.number().positive('Sale price must be positive').optional().nullable(),
  stock_quantity: z.number({ error: 'Stock is required' }).int().min(0, 'Stock cannot be negative'),
});

export type CreateVariantFormData = z.infer<typeof createVariantSchema>;

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100),
  parent_id: z.number().int().positive().optional().nullable(),
});

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
