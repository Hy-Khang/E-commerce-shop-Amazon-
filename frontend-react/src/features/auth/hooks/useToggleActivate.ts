import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUserService } from '../services/admin.service';
import { adminUserKeys } from './useAdminUsers';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';

export function useToggleActivate() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => adminUserService.toggleActivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      showSuccessToast(t((m) => m.toast.auth.statusUpdated));
    },
  });
}
