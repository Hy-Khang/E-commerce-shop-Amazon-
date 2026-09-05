/** Behavioral actions captured in `user_activity_log`. */
export enum ActivityAction {
  ViewProduct = 'VIEW_PRODUCT',
  ViewCategory = 'VIEW_CATEGORY',
  Search = 'SEARCH',
  AddToCart = 'ADD_TO_CART',
  AddToWishlist = 'ADD_TO_WISHLIST',
  Purchase = 'PURCHASE',
}

/** What `target_id` points at. */
export enum ActivityTargetType {
  Product = 'product',
  Category = 'category',
  Search = 'search',
}

/** Caller identity — a customer (JWT) or a guest (x-session-id). Exactly one set. */
export interface RecommendationOwner {
  userId: number | null;
  sessionId: string | null;
}

/**
 * A resolved product interaction row (target_id joined to its product facts).
 * Built by the repository's profile query; scored in memory by the service.
 */
export interface InteractedProduct {
  productId: number;
  categoryId: number | null;
  shopId: number | null;
  price: number | null;
  action: string;
}

/** Content-based profile derived on-demand from the caller's recent activity. */
export interface UserProfile {
  /** category_id → weighted score. */
  categoryWeights: Map<number, number>;
  /** shop_id → interaction count. */
  shopWeights: Map<number, number>;
  priceMin: number | null;
  priceMax: number | null;
  /** product ids already purchased — excluded from suggestions. */
  purchasedProductIds: Set<number>;
  /** product ids interacted with recently — de-prioritized/excluded as dupes. */
  interactedProductIds: Set<number>;
  /** Top-weighted category id (drives the reason label); null when cold-start. */
  topCategoryId: number | null;
}
