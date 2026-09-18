import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userProfileService } from '../services/user-profile.service';
import { profileKeys } from './useProfile';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';
import type { UpdateProfileRequest } from '../types/user-profile.types';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      userProfileService.updateProfile(data).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() });
      showSuccessToast(t('profile.updated'));
    },
  });
}
