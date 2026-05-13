import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userProfileService } from '../services/user-profile.service';
import { addressKeys } from './useAddresses';

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userProfileService.deleteAddress(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}
