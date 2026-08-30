import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type { ProductListItem } from '@/features/product';
import type { MergeRecentlyViewedRequest } from '../types/recently-viewed.types';

export const recentlyViewedService = {
  // Authenticated: DB-backed history (newest first, max 20).
  getList: () =>
    api.get<SuccessResponse<ProductListItem[]>>('/recently-viewed'),

  track: (productId: number) =>
    api.post('/recently-viewed', { product_id: productId }),

  merge: (data: MergeRecentlyViewedRequest) =>
    api.post<SuccessResponse<ProductListItem[]>>('/recently-viewed/merge', data),

  // Guest: hydrate fresh product data for a set of ids via the public catalog.
  getByIds: (ids: number[]) =>
    api.get<PaginatedResponse<ProductListItem>>('/products', {
      params: { ids: ids.join(','), limit: ids.length },
    }),
};
