import { useQuery } from '@tanstack/react-query';
import { userProfileService } from '../services/user-profile.service';

export const addressKeys = {
  all: ['addresses'] as const,
  list: () => ['addresses', 'list'] as const,
};

export function useAddresses() {
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: () => userProfileService.getAddresses(),
    staleTime: 60 * 1000,
    select: (res) => res.data.data,
  });
}
