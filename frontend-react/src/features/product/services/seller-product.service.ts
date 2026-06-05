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
} from '../types/product.types';

export const sellerProductService = {
  getList: (params: AdminProductListParams) =>
    api.get<PaginatedResponse<ProductListItem>>('/seller/products', { params }),

  getById: (id: number) =>
    api.get<SuccessResponse<AdminProductDetail>>(`/seller/products/${id}`),

  create: (data: CreateProductRequest) =>
    api.post<SuccessResponse<Product>>('/seller/products', data),

  update: (id: number, data: UpdateProductRequest) =>
    api.patch<SuccessResponse<Product>>(`/seller/products/${id}`, data),

  toggleActive: (id: number) =>
    api.patch<SuccessResponse<Product>>(`/seller/products/${id}/activate`),

  addVariant: (productId: number, data: CreateVariantRequest) =>
    api.post<SuccessResponse<ProductVariant>>(`/seller/products/${productId}/variants`, data),

  updateVariant: (variantId: number, data: UpdateVariantRequest) =>
    api.patch<SuccessResponse<ProductVariant>>(`/seller/variants/${variantId}`, data),

  deleteVariant: (variantId: number) =>
    api.delete(`/seller/variants/${variantId}`),

  addImage: (productId: number, data: CreateImageRequest) =>
    api.post<SuccessResponse<ProductImage>>(`/seller/products/${productId}/images`, data),

  updateImage: (imageId: number, data: UpdateImageRequest) =>
    api.patch<SuccessResponse<ProductImage>>(`/seller/images/${imageId}`, data),

  deleteImage: (imageId: number) =>
    api.delete(`/seller/images/${imageId}`),
};
