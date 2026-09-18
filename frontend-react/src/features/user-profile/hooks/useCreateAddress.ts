import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userProfileService } from '../services/user-profile.service';
import { addressKeys } from './useAddresses';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';
import type { CreateAddressRequest } from '../types/user-profile.types';

export function useCreateAddress() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (data: CreateAddressRequest) =>
      userProfileService.createAddress(data).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
      showSuccessToast(t('address.added'));
    },
  });
}
