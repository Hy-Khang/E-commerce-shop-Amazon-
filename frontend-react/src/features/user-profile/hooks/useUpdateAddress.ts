import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userProfileService } from '../services/user-profile.service';
import { addressKeys } from './useAddresses';
import type { UpdateAddressRequest } from '../types/user-profile.types';

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAddressRequest }) =>
      userProfileService.updateAddress(id, data).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}
