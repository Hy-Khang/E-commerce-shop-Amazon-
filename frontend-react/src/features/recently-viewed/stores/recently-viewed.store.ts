import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RecentlyViewedEntry } from '../types/recently-viewed.types';

const STORAGE_KEY = 'recently_viewed';
const MAX_ENTRIES = 20;

interface RecentlyViewedState {
  /** Newest-first list of viewed products (guest only). */
  entries: RecentlyViewedEntry[];
  add: (productId: number) => void;
  clear: () => void;
}

/**
 * Guest recently-viewed history, persisted to localStorage. Authenticated
 * users are tracked in the DB instead; on login this list is merged then cleared.
 */
export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      entries: [],
      add: (productId) =>
        set((state) => {
          const without = state.entries.filter((e) => e.product_id !== productId);
          const next: RecentlyViewedEntry[] = [
            { product_id: productId, viewed_at: new Date().toISOString() },
            ...without,
          ];
          return { entries: next.slice(0, MAX_ENTRIES) };
        }),
      clear: () => set({ entries: [] }),
    }),
    { name: STORAGE_KEY },
  ),
);
