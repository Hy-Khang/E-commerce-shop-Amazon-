import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFlashSaleService } from '../services/admin-flash-sale.service';
import { adminFlashSaleKeys } from './useAdminFlashSales';
import { flashSaleKeys } from './useActiveFlashSales';
import { showSuccessToast } from '@/common/components/feedback/toast';
import type {
  CreateFlashSaleRequest,
  UpdateFlashSaleRequest,
  ReviewFlashSaleItemRequest,
} from '../types/flash-sale.types';

/** Invalidate both admin lists/details and the public active feed. */
function useInvalidateFlashSales() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: adminFlashSaleKeys.all });
    queryClient.invalidateQueries({ queryKey: flashSaleKeys.all });
  };
}

export function useCreateFlashSale() {
  const invalidate = useInvalidateFlashSales();
  return useMutation({
    mutationFn: (data: CreateFlashSaleRequest) =>
      adminFlashSaleService.create(data).then((res) => res.data.data),
    onSuccess: () => {
      invalidate();
      showSuccessToast('Flash sale created');
    },
  });
}

export function useUpdateFlashSale(id: number) {
  const invalidate = useInvalidateFlashSales();
  return useMutation({
    mutationFn: (data: UpdateFlashSaleRequest) =>
      adminFlashSaleService.update(id, data).then((res) => res.data.data),
    onSuccess: () => {
      invalidate();
      showSuccessToast('Flash sale updated');
    },
  });
}

export function useDeleteFlashSale() {
  const invalidate = useInvalidateFlashSales();
  return useMutation({
    mutationFn: (id: number) => adminFlashSaleService.remove(id),
    onSuccess: () => {
      invalidate();
      showSuccessToast('Flash sale deleted');
    },
  });
}

export function useApproveFlashSaleItem() {
  const invalidate = useInvalidateFlashSales();
  return useMutation({
    mutationFn: (itemId: number) =>
      adminFlashSaleService.approveItem(itemId).then((res) => res.data.data),
    onSuccess: () => {
      invalidate();
      showSuccessToast('Registration approved');
    },
  });
}

export function useRejectFlashSaleItem() {
  const invalidate = useInvalidateFlashSales();
  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: number;
      data: ReviewFlashSaleItemRequest;
    }) =>
      adminFlashSaleService.rejectItem(itemId, data).then((res) => res.data.data),
    onSuccess: () => {
      invalidate();
      showSuccessToast('Registration rejected');
    },
  });
}

export function useRemoveFlashSaleItem() {
  const invalidate = useInvalidateFlashSales();
  return useMutation({
    mutationFn: (itemId: number) => adminFlashSaleService.removeItem(itemId),
    onSuccess: () => {
      invalidate();
      showSuccessToast('Registration removed');
    },
  });
}
