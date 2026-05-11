import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type { Cart, AddToCartRequest, UpdateCartItemRequest, MergeCartRequest } from '../types/cart.types';

export const cartService = {
  getCart: () =>
    api.get<SuccessResponse<Cart>>('/cart'),

  addItem: (data: AddToCartRequest) =>
    api.post<SuccessResponse<Cart>>('/cart/items', data),

  updateItem: (id: number, data: UpdateCartItemRequest) =>
    api.patch<SuccessResponse<Cart>>(`/cart/items/${id}`, data),

  removeItem: (id: number) =>
    api.delete(`/cart/items/${id}`),

  merge: (data: MergeCartRequest) =>
    api.post<SuccessResponse<Cart>>('/cart/merge', data),
};
