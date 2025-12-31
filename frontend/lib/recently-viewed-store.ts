import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Property } from '@/data/properties';

interface RecentlyViewedState {
  recentlyViewed: Property[];
  addRecentlyViewed: (property: Property) => void;
  getRecentlyViewed: () => Property[];
  clearRecentlyViewed: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      recentlyViewed: [],

      addRecentlyViewed: (property: Property) => {
        set((state) => {
          // Remove property if it already exists
          const filtered = state.recentlyViewed.filter(p => p.id !== property.id);
          // Add to beginning and limit to 10 items
          return {
            recentlyViewed: [property, ...filtered].slice(0, 10),
          };
        });
      },

      getRecentlyViewed: () => {
        return get().recentlyViewed;
      },

      clearRecentlyViewed: () => {
        set({ recentlyViewed: [] });
      },
    }),
    {
      name: 'recently-viewed-storage',
    }
  )
);
