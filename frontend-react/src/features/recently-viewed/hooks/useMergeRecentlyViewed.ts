import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recentlyViewedService } from '../services/recently-viewed.service';
import { useRecentlyViewedStore } from '../stores/recently-viewed.store';
import { recentlyViewedKeys } from './useRecentlyViewed';

/**
 * Merges the guest (localStorage) view history into the user's DB history on
 * login, then clears the local list. Best-effort — mirrors cart merge.
 */
export function useMergeRecentlyViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const entries = useRecentlyViewedStore.getState().entries;
      if (entries.length === 0) return [];
      const res = await recentlyViewedService.merge({ items: entries });
      return res.data.data;
    },
    meta: { suppressToast: true },
    onSuccess: () => {
      useRecentlyViewedStore.getState().clear();
      queryClient.invalidateQueries({ queryKey: recentlyViewedKeys.all });
    },
  });
}
