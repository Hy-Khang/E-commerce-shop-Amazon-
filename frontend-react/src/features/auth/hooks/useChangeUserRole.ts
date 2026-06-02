import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUserService } from '../services/admin.service';
import { adminUserKeys } from './useAdminUsers';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';
import type { UpdateUserRoleRequest } from '../types/admin.types';

export function useChangeUserRole() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRoleRequest }) =>
      adminUserService.changeRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      showSuccessToast(t((m) => m.toast.auth.roleUpdated));
    },
  });
}
