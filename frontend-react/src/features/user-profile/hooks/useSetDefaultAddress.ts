import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userProfileService } from '../services/user-profile.service';
import { addressKeys } from './useAddresses';

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      userProfileService.setDefaultAddress(id).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}
