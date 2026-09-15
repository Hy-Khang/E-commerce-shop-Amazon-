import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerApplicationService } from '../services/seller-application.service';
import { sellerApplicationKeys } from './useSellerApplication';
import {
  showSuccessToast,
  showErrorToast,
} from '@/common/components/feedback/toast';
import type {
  SellerApplication,
  CreateSellerApplicationRequest,
} from '../types/seller-application.types';

/** Customer: submit a seller onboarding application. */
export function useApplySeller() {
  const queryClient = useQueryClient();

  return useMutation<SellerApplication, Error, CreateSellerApplicationRequest>({
    mutationFn: (data) =>
      sellerApplicationService.apply(data).then((res) => res.data.data),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerApplicationKeys.mine() });
      showSuccessToast('Seller application submitted');
    },
    onError: (error) => showErrorToast(error),
  });
}
