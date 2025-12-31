import { create } from 'zustand';
import { type Property } from '@/data/properties';

interface ComparisonState {
  properties: Property[];
  addToComparison: (property: Property) => boolean;
  removeFromComparison: (propertyId: number) => void;
  clearComparison: () => void;
  isInComparison: (propertyId: number) => boolean;
}

const MAX_COMPARISON_ITEMS = 4;

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  properties: [],

  addToComparison: (property) => {
    const { properties } = get();

    // Check if already in comparison
    if (properties.some(p => p.id === property.id)) {
      return false;
    }

    // Check max limit
    if (properties.length >= MAX_COMPARISON_ITEMS) {
      return false;
    }

    set({ properties: [...properties, property] });
    return true;
  },

  removeFromComparison: (propertyId) => {
    const { properties } = get();
    set({ properties: properties.filter(p => p.id !== propertyId) });
  },

  clearComparison: () => {
    set({ properties: [] });
  },

  isInComparison: (propertyId) => {
    const { properties } = get();
    return properties.some(p => p.id === propertyId);
  },
}));
