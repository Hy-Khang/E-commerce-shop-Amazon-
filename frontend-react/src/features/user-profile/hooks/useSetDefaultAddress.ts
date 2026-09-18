import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userProfileService } from '../services/user-profile.service';
import { addressKeys } from './useAddresses';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (id: number) =>
      userProfileService.setDefaultAddress(id).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
      showSuccessToast(t('address.defaultSet'));
    },
  });
}
