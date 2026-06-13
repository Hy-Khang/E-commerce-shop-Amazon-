import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type { Product, ProductListItem, Category, ProductListParams, CategoryDetail, HomepageData } from '../types/product.types';

export const productService = {
  getList: (params: ProductListParams) =>
    api.get<PaginatedResponse<ProductListItem>>('/products', { params }),

  getBySlug: (slug: string) =>
    api.get<SuccessResponse<Product>>(`/products/${slug}`),

  getCategories: () =>
    api.get<SuccessResponse<Category[]>>('/categories'),

  getCategoryBySlug: (slug: string) =>
    api.get<SuccessResponse<CategoryDetail>>(`/categories/${slug}`),

  getHomepage: () =>
    api.get<SuccessResponse<HomepageData>>('/homepage'),
};
