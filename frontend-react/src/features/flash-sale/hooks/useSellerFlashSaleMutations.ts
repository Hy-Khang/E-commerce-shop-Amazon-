import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerFlashSaleService } from '../services/seller-flash-sale.service';
import { sellerFlashSaleKeys } from './useSellerFlashSales';
import { showSuccessToast } from '@/common/components/feedback/toast';
import type {
  RegisterFlashSaleItemRequest,
  UpdateFlashSaleItemRequest,
} from '../types/flash-sale.types';

function useInvalidateSellerFlash() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: sellerFlashSaleKeys.all });
}

export function useRegisterFlashItem() {
  const invalidate = useInvalidateSellerFlash();
  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: number;
      data: RegisterFlashSaleItemRequest;
    }) =>
      sellerFlashSaleService
        .register(campaignId, data)
        .then((res) => res.data.data),
    onSuccess: () => {
      invalidate();
      showSuccessToast('Đã gửi đăng ký Flash Sale');
    },
  });
}

export function useUpdateFlashRegistration() {
  const invalidate = useInvalidateSellerFlash();
  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: number;
      data: UpdateFlashSaleItemRequest;
    }) =>
      sellerFlashSaleService
        .updateItem(itemId, data)
        .then((res) => res.data.data),
    onSuccess: () => {
      invalidate();
      showSuccessToast('Đã cập nhật đăng ký');
    },
  });
}

export function useWithdrawFlashRegistration() {
  const invalidate = useInvalidateSellerFlash();
  return useMutation({
    mutationFn: (itemId: number) => sellerFlashSaleService.withdrawItem(itemId),
    onSuccess: () => {
      invalidate();
      showSuccessToast('Đã rút đăng ký');
    },
  });
}
