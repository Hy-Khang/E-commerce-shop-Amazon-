import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerApplicationService } from '../services/seller-application.service';
import { sellerApplicationKeys } from './useSellerApplication';
import {
  showSuccessToast,
  showErrorToast,
} from '@/common/components/feedback/toast';
import type { SellerApplication } from '../types/seller-application.types';

/** Admin: approve an application (grants seller role + creates active shop). */
export function useApproveApplication() {
  const queryClient = useQueryClient();

  return useMutation<SellerApplication, Error, number>({
    mutationFn: (id) =>
      sellerApplicationService.approve(id).then((res) => res.data.data),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerApplicationKeys.all });
      showSuccessToast('Application approved — the user is now a seller');
    },
    onError: (error) => showErrorToast(error),
  });
}

/** Admin: reject an application (optional reason). */
export function useRejectApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    SellerApplication,
    Error,
    { id: number; reject_reason?: string }
  >({
    mutationFn: ({ id, reject_reason }) =>
      sellerApplicationService
        .reject(id, reject_reason)
        .then((res) => res.data.data),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerApplicationKeys.all });
      showSuccessToast('Application rejected');
    },
    onError: (error) => showErrorToast(error),
  });
}
