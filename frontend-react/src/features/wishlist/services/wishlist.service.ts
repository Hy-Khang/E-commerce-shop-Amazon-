import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type {
  WishlistItem,
  WishlistCheckResult,
  BulkCheckResult,
  AddToWishlistRequest,
  BulkCheckWishlistRequest,
  WishlistListParams,
} from '../types/wishlist.types';

export const wishlistService = {
  add: (data: AddToWishlistRequest) =>
    api.post<SuccessResponse<WishlistItem>>('/wishlist', data),

  remove: (productId: number) =>
    api.delete(`/wishlist/${productId}`),

  getList: (params: WishlistListParams) =>
    api.get<PaginatedResponse<WishlistItem>>('/wishlist', { params }),

  check: (productId: number) =>
    api.get<SuccessResponse<WishlistCheckResult>>(`/wishlist/check/${productId}`),

  bulkCheck: (data: BulkCheckWishlistRequest) =>
    api.post<SuccessResponse<BulkCheckResult>>('/wishlist/check', data),
};
