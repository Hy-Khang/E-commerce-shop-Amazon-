import { useQuery } from '@tanstack/react-query';
import { sellerApplicationService } from '../services/seller-application.service';
import type { SellerApplicationFilterParams } from '../types/seller-application.types';

export const sellerApplicationKeys = {
  all: ['seller-applications'] as const,
  mine: () => ['seller-applications', 'mine'] as const,
  adminList: (params: SellerApplicationFilterParams) =>
    ['seller-applications', 'admin', 'list', params] as const,
  adminDetail: (id: number) =>
    ['seller-applications', 'admin', 'detail', id] as const,
};

/** The current user's latest seller application (null if never applied). */
export function useMyApplication(enabled = true) {
  return useQuery({
    queryKey: sellerApplicationKeys.mine(),
    queryFn: () => sellerApplicationService.getMine(),
    enabled,
    staleTime: 30 * 1000,
    select: (res) => res.data.data,
  });
}

/** Admin: paginated moderation queue. */
export function useSellerApplications(params: SellerApplicationFilterParams) {
  return useQuery({
    queryKey: sellerApplicationKeys.adminList(params),
    queryFn: () => sellerApplicationService.list(params),
    select: (res) => res.data,
  });
}

/** Admin: single application detail. */
export function useSellerApplicationDetail(id: number) {
  return useQuery({
    queryKey: sellerApplicationKeys.adminDetail(id),
    queryFn: () => sellerApplicationService.getById(id),
    select: (res) => res.data.data,
  });
}
