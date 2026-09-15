import { api } from '@/core/api/axios-instance';
import type { PaginatedResponse } from '@/core/api/api.types';
import type { ProductListItem } from '@/features/product';

export const compareService = {
  // Hydrate fresh product data (incl. avgRating/reviewCount + category) for a set
  // of ids via the public catalog. The bulk `?ids=` path returns the full set.
  getByIds: (ids: number[]) =>
    api.get<PaginatedResponse<ProductListItem>>('/products', {
      params: { ids: ids.join(',') },
    }),
};
