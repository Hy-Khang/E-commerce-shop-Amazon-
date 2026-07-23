import { useMutation } from '@tanstack/react-query';
import { paymentService } from '../services/payment.service';
import type { CreatePaymentRequest } from '../types/payment.types';

export function useCreatePayment() {
  return useMutation({
    mutationFn: (data: CreatePaymentRequest) =>
      paymentService.createPayment(data).then((res) => res.data.data),
    meta: { suppressToast: true },
  });
}
