import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userProfileService } from '../services/user-profile.service';
import { addressKeys } from './useAddresses';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => userProfileService.deleteAddress(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
      showSuccessToast(t((m) => m.toast.address.deleted));
    },
  });
}
