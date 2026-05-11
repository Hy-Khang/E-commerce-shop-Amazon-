import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type {
  Product,
  ProductListItem,
  AdminProductDetail,
  AdminProductListParams,
  CreateProductRequest,
  UpdateProductRequest,
  ProductVariant,
  CreateVariantRequest,
  UpdateVariantRequest,
  ProductImage,
  CreateImageRequest,
  UpdateImageRequest,
  AdminCategory,
  AdminCategoryListParams,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Category,
} from '../types/product.types';

export const adminProductService = {
  getList: (params: AdminProductListParams) =>
    api.get<PaginatedResponse<ProductListItem>>('/admin/products', { params }),

  getById: (id: number) =>
    api.get<SuccessResponse<AdminProductDetail>>(`/admin/products/${id}`),

  create: (data: CreateProductRequest) =>
    api.post<SuccessResponse<Product>>('/admin/products', data),

  update: (id: number, data: UpdateProductRequest) =>
    api.patch<SuccessResponse<Product>>(`/admin/products/${id}`, data),

  toggleActive: (id: number) =>
    api.patch<SuccessResponse<Product>>(`/admin/products/${id}/activate`),

  // Variants
  addVariant: (productId: number, data: CreateVariantRequest) =>
    api.post<SuccessResponse<ProductVariant>>(`/admin/products/${productId}/variants`, data),

  updateVariant: (variantId: number, data: UpdateVariantRequest) =>
    api.patch<SuccessResponse<ProductVariant>>(`/admin/variants/${variantId}`, data),

  deleteVariant: (variantId: number) =>
    api.delete(`/admin/variants/${variantId}`),

  // Images
  addImage: (productId: number, data: CreateImageRequest) =>
    api.post<SuccessResponse<ProductImage>>(`/admin/products/${productId}/images`, data),

  updateImage: (imageId: number, data: UpdateImageRequest) =>
    api.patch<SuccessResponse<ProductImage>>(`/admin/images/${imageId}`, data),

  deleteImage: (imageId: number) =>
    api.delete(`/admin/images/${imageId}`),
};

export const adminCategoryService = {
  getList: (params: AdminCategoryListParams) =>
    api.get<PaginatedResponse<AdminCategory>>('/admin/categories', { params }),

  getById: (id: number) =>
    api.get<SuccessResponse<AdminCategory>>(`/admin/categories/${id}`),

  create: (data: CreateCategoryRequest) =>
    api.post<SuccessResponse<Category>>('/admin/categories', data),

  update: (id: number, data: UpdateCategoryRequest) =>
    api.patch<SuccessResponse<Category>>(`/admin/categories/${id}`, data),

  delete: (id: number) =>
    api.delete(`/admin/categories/${id}`),
};
