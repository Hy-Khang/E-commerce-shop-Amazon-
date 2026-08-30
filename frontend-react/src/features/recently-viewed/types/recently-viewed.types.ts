export interface RecentlyViewedEntry {
  product_id: number;
  viewed_at: string; // ISO 8601
}

export interface MergeRecentlyViewedRequest {
  items: RecentlyViewedEntry[];
}
