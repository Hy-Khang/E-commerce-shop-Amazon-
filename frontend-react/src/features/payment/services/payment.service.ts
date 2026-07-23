import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentTransaction,
} from '../types/payment.types';

export const paymentService = {
  createPayment: (data: CreatePaymentRequest) =>
    api.post<SuccessResponse<CreatePaymentResponse>>('/payments/create', data),

  getByOrder: (orderId: number) =>
    api.get<SuccessResponse<PaymentTransaction[]>>(`/payments/order/${orderId}`),
};
