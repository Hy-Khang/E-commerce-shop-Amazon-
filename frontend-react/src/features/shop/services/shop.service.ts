import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type { Shop, ShopProfile, ShopListParams } from '../types/shop.types';
import type { ProductListItem, ProductListParams } from '@/features/product/types/product.types';

export const shopService = {
  getList: (params: ShopListParams) =>
    api.get<PaginatedResponse<Shop>>('/shops', { params }),

  getBySlug: (slug: string) =>
    api.get<SuccessResponse<ShopProfile>>(`/shops/${slug}`),

  getProducts: (slug: string, params: ProductListParams) =>
    api.get<PaginatedResponse<ProductListItem>>(`/shops/${slug}/products`, { params }),
};
