import { api } from '@/core/api/axios-instance';
import type { PaginatedResponse } from '@/core/api/api.types';
import type { PopularWishlistItem, AdminPopularWishlistParams } from '../types/wishlist.types';

export const adminWishlistService = {
  getPopular: (params: AdminPopularWishlistParams) =>
    api.get<PaginatedResponse<PopularWishlistItem>>('/admin/wishlist/popular', { params }),
};
