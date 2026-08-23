import { api } from '@/core/api/axios-instance';
import type { PaginatedResponse } from '@/core/api/api.types';
import type { PopularWishlistItem, AdminPopularWishlistParams } from '../types/wishlist.types';

export const sellerWishlistService = {
  getPopular: (params: AdminPopularWishlistParams) =>
    api.get<PaginatedResponse<PopularWishlistItem>>('/seller/wishlist/popular', { params }),
};
