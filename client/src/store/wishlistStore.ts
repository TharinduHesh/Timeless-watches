import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WishlistItem } from '../types';

interface WishlistState {
  items: WishlistItem[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addToWishlist: (productId: string) => {
        const { items } = get();
        if (!items.find(item => item.productId === productId)) {
          set({
            items: [
              ...items,
              {
                productId,
                addedAt: new Date().toISOString(),
              },
            ],
          });
        }
      },

      removeFromWishlist: (productId: string) => {
        set(state => ({
          items: state.items.filter(item => item.productId !== productId),
        }));
      },

      toggleWishlist: (productId: string) => {
        const { isInWishlist, addToWishlist, removeFromWishlist } = get();
        if (isInWishlist(productId)) {
          removeFromWishlist(productId);
        } else {
          addToWishlist(productId);
        }
      },

      isInWishlist: (productId: string) => {
        const { items } = get();
        return items.some(item => item.productId === productId);
      },

      clearWishlist: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
