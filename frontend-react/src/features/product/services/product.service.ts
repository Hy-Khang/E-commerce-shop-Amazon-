import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type { Product, ProductListItem, Category, ProductListParams, CategoryDetail, HomepageData, SearchSuggestions, VisualSearchResult } from '../types/product.types';

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

  getSuggestions: (q: string, limit?: number) =>
    api.get<SuccessResponse<SearchSuggestions>>('/products/suggestions', { params: { q, limit } }),

  searchByImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<SuccessResponse<VisualSearchResult>>('/products/search-by-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
