import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CompareEntry, CompareAddResult } from '../types/compare.types';

const STORAGE_KEY = 'compare_candidates';
export const MAX_COMPARE = 4;

interface CompareState {
  /** Products picked for comparison. All share the first item's category. */
  items: CompareEntry[];
  /** Add a product; enforces the cap, dedupe, and the same-category lock. */
  add: (productId: number, categoryId: number) => CompareAddResult;
  /** Remove a product — always allowed (never blocked by the category lock). */
  remove: (productId: number) => void;
  clear: () => void;
  /**
   * Drop entries whose id is not in `validIds`. Used to reconcile the store
   * with the server after a fetch (a product may have gone inactive). Keeps the
   * array reference stable when nothing actually changes (Zustand v5 snapshot).
   */
  prune: (validIds: number[]) => void;
}

/**
 * Product comparison set, persisted to localStorage. Frontend-only state (no DB) —
 * up to 4 products of the same category, hydrated fresh via the public catalog.
 */
export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (productId, categoryId) => {
        const { items } = get();
        if (items.some((i) => i.product_id === productId)) return 'added';
        if (items.length >= MAX_COMPARE) return 'full';
        if (items.length > 0 && items[0].category_id !== categoryId) {
          return 'different_category';
        }
        set({ items: [...items, { product_id: productId, category_id: categoryId }] });
        return 'added';
      },
      remove: (productId) =>
        set((state) => {
          if (!state.items.some((i) => i.product_id === productId)) return state;
          return { items: state.items.filter((i) => i.product_id !== productId) };
        }),
      clear: () => set((state) => (state.items.length === 0 ? state : { items: [] })),
      prune: (validIds) =>
        set((state) => {
          const valid = new Set(validIds);
          const next = state.items.filter((i) => valid.has(i.product_id));
          // Preserve the reference when nothing was removed.
          return next.length === state.items.length ? state : { items: next };
        }),
    }),
    { name: STORAGE_KEY },
  ),
);
