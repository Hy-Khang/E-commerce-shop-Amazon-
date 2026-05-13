import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type {
  UserProfile,
  Address,
  UpdateProfileRequest,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '../types/user-profile.types';

export const userProfileService = {
  getProfile: () =>
    api.get<SuccessResponse<UserProfile>>('/users/me'),

  updateProfile: (data: UpdateProfileRequest) =>
    api.patch<SuccessResponse<UserProfile>>('/users/me', data),

  getAddresses: () =>
    api.get<SuccessResponse<Address[]>>('/addresses'),

  createAddress: (data: CreateAddressRequest) =>
    api.post<SuccessResponse<Address>>('/addresses', data),

  updateAddress: (id: number, data: UpdateAddressRequest) =>
    api.patch<SuccessResponse<Address>>(`/addresses/${id}`, data),

  deleteAddress: (id: number) =>
    api.delete(`/addresses/${id}`),

  setDefaultAddress: (id: number) =>
    api.patch<SuccessResponse<Address>>(`/addresses/${id}/default`),
};
