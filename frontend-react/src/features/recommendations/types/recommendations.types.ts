import type { ProductListItem } from '@/features/product';

/** Behavioral actions accepted by `POST /activity`. */
export type ActivityAction =
  | 'VIEW_PRODUCT'
  | 'VIEW_CATEGORY'
  | 'SEARCH'
  | 'ADD_TO_CART'
  | 'ADD_TO_WISHLIST'
  | 'PURCHASE';

export type ActivityTargetType = 'product' | 'category' | 'search';

export interface TrackActivityRequest {
  action: ActivityAction;
  target_type: ActivityTargetType;
  target_id?: number;
  metadata?: Record<string, unknown>;
}

/** `GET /recommendations` payload. */
export interface RecommendationsResult {
  reason: string | null;
  products: ProductListItem[];
}

/** `GET /products/:id/similar` and `/frequently-bought-together` payload. */
export interface ProductListResult {
  products: ProductListItem[];
}
