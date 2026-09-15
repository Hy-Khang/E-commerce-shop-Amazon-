import { api } from '@/core/api/axios-instance';
import type {
  SuccessResponse,
  PaginatedResponse,
} from '@/core/api/api.types';
import type {
  SellerApplication,
  CreateSellerApplicationRequest,
  SellerApplicationFilterParams,
} from '../types/seller-application.types';

export const sellerApplicationService = {
  // Customer
  getMine: () =>
    api.get<SuccessResponse<SellerApplication | null>>(
      '/seller-applications/me',
    ),

  apply: (data: CreateSellerApplicationRequest) =>
    api.post<SuccessResponse<SellerApplication>>('/seller-applications', data),

  // Admin
  list: (params: SellerApplicationFilterParams) =>
    api.get<PaginatedResponse<SellerApplication>>(
      '/admin/seller-applications',
      { params },
    ),

  getById: (id: number) =>
    api.get<SuccessResponse<SellerApplication>>(
      `/admin/seller-applications/${id}`,
    ),

  approve: (id: number) =>
    api.patch<SuccessResponse<SellerApplication>>(
      `/admin/seller-applications/${id}/approve`,
    ),

  reject: (id: number, reject_reason?: string) =>
    api.patch<SuccessResponse<SellerApplication>>(
      `/admin/seller-applications/${id}/reject`,
      { reject_reason },
    ),
};
