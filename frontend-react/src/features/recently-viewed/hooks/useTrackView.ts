import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import { recentlyViewedService } from '../services/recently-viewed.service';
import { useRecentlyViewedStore } from '../stores/recently-viewed.store';
import { recentlyViewedKeys } from './useRecentlyViewed';

/**
 * Records a product view once per productId change. Authenticated users are
 * tracked in the DB (best-effort); guests are tracked in localStorage.
 */
export function useTrackView(productId: number | undefined) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addGuest = useRecentlyViewedStore((s) => s.add);
  const queryClient = useQueryClient();
  const trackedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!productId || trackedRef.current === productId) return;
    trackedRef.current = productId;

    if (isAuthenticated) {
      recentlyViewedService
        .track(productId)
        .then(() => queryClient.invalidateQueries({ queryKey: recentlyViewedKeys.all }))
        .catch(() => {
          // tracking is best-effort — never surface to the user
        });
    } else {
      addGuest(productId);
    }
  }, [productId, isAuthenticated, addGuest, queryClient]);
}
