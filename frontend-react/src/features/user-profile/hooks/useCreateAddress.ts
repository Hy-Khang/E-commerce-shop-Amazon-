import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userProfileService } from '../services/user-profile.service';
import { addressKeys } from './useAddresses';
import type { CreateAddressRequest } from '../types/user-profile.types';

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAddressRequest) =>
      userProfileService.createAddress(data).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}
