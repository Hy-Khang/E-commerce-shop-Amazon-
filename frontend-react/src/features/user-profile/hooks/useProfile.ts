import { useQuery } from '@tanstack/react-query';
import { userProfileService } from '../services/user-profile.service';

export const profileKeys = {
  current: () => ['profile'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: () => userProfileService.getProfile(),
    staleTime: 60 * 1000,
    select: (res) => res.data.data,
  });
}
