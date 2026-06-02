import { create } from 'zustand';

interface WishlistState {
  itemCount: number;
  setItemCount: (count: number) => void;
}

export const useWishlistStore = create<WishlistState>((set) => ({
  itemCount: 0,
  setItemCount: (count) => set({ itemCount: count }),
}));
