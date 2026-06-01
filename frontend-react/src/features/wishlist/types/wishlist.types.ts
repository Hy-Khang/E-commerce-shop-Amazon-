import type { PaginationParams } from '@/common/types/common.types';

// --- Response types ---

export interface WishlistItem {
  product_id: number;
  product_name: string;
  product_slug: string;
  product_thumbnail_url: string | null;
  product_is_active: boolean;
  min_price: number | null;
  min_sale_price: number | null;
  added_at: string;
}

export interface WishlistCheckResult {
  in_wishlist: boolean;
}

export interface BulkCheckResult {
  items: Record<number, boolean>;
}

export interface PopularWishlistItem {
  product_id: number;
  product_name: string;
  product_slug: string;
  product_thumbnail_url: string | null;
  product_is_active: boolean;
  wishlist_count: number;
}

// --- Request types ---

export interface AddToWishlistRequest {
  product_id: number;
}

export interface BulkCheckWishlistRequest {
  product_ids: number[];
}

// --- Query params ---

export interface WishlistListParams extends PaginationParams {}

export interface AdminPopularWishlistParams extends PaginationParams {}
