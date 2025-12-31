import { create } from 'zustand';
import type { Property } from '@/data/properties';

export interface WishlistItem {
  property: Property;
  note?: string;
  addedAt: string;
}

export interface WishlistCollection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  items: WishlistItem[];
  isPublic: boolean;
  shareLink?: string;
  createdAt: string;
  updatedAt: string;
}

interface WishlistState {
  collections: WishlistCollection[];
  loadCollections: () => void;
  createCollection: (name: string, description?: string) => void;
  updateCollection: (id: string, data: Partial<WishlistCollection>) => void;
  deleteCollection: (id: string) => void;
  addToCollection: (collectionId: string, property: Property, note?: string) => void;
  removeFromCollection: (collectionId: string, propertyId: number) => void;
  updateItemNote: (collectionId: string, propertyId: number, note: string) => void;
  togglePublic: (collectionId: string) => void;
  generateShareLink: (collectionId: string) => string;
}

// Mock data for demo
const mockCollections: WishlistCollection[] = [
  {
    id: 'col-1',
    name: 'Summer 2025 Options',
    description: 'Places I\'m considering for summer internship',
    coverImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    items: [],
    isPublic: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'col-2',
    name: 'Budget Friendly',
    description: 'Affordable options under $800/month',
    coverImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    items: [],
    isPublic: true,
    shareLink: 'https://sublet.com/shared/budget-friendly-abc123',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useWishlistStore = create<WishlistState>((set, get) => ({
  collections: [],

  loadCollections: () => {
    // Load from localStorage or use mock data
    const saved = localStorage.getItem('wishlistCollections');
    if (saved) {
      set({ collections: JSON.parse(saved) });
    } else {
      set({ collections: mockCollections });
      localStorage.setItem('wishlistCollections', JSON.stringify(mockCollections));
    }
  },

  createCollection: (name: string, description?: string) => {
    const newCollection: WishlistCollection = {
      id: `col-${Date.now()}`,
      name,
      description,
      items: [],
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...get().collections, newCollection];
    set({ collections: updated });
    localStorage.setItem('wishlistCollections', JSON.stringify(updated));
  },

  updateCollection: (id: string, data: Partial<WishlistCollection>) => {
    const updated = get().collections.map(col =>
      col.id === id
        ? { ...col, ...data, updatedAt: new Date().toISOString() }
        : col
    );
    set({ collections: updated });
    localStorage.setItem('wishlistCollections', JSON.stringify(updated));
  },

  deleteCollection: (id: string) => {
    const updated = get().collections.filter(col => col.id !== id);
    set({ collections: updated });
    localStorage.setItem('wishlistCollections', JSON.stringify(updated));
  },

  addToCollection: (collectionId: string, property: Property, note?: string) => {
    const updated = get().collections.map(col => {
      if (col.id === collectionId) {
        // Check if property already exists
        const exists = col.items.some(item => item.property.id === property.id);
        if (exists) return col;

        const newItem: WishlistItem = {
          property,
          note,
          addedAt: new Date().toISOString(),
        };

        return {
          ...col,
          items: [...col.items, newItem],
          updatedAt: new Date().toISOString(),
          // Set cover image to first property if not set
          coverImage: col.coverImage || property.images?.[0] || property.image,
        };
      }
      return col;
    });

    set({ collections: updated });
    localStorage.setItem('wishlistCollections', JSON.stringify(updated));
  },

  removeFromCollection: (collectionId: string, propertyId: number) => {
    const updated = get().collections.map(col => {
      if (col.id === collectionId) {
        return {
          ...col,
          items: col.items.filter(item => item.property.id !== propertyId),
          updatedAt: new Date().toISOString(),
        };
      }
      return col;
    });

    set({ collections: updated });
    localStorage.setItem('wishlistCollections', JSON.stringify(updated));
  },

  updateItemNote: (collectionId: string, propertyId: number, note: string) => {
    const updated = get().collections.map(col => {
      if (col.id === collectionId) {
        return {
          ...col,
          items: col.items.map(item =>
            item.property.id === propertyId
              ? { ...item, note }
              : item
          ),
          updatedAt: new Date().toISOString(),
        };
      }
      return col;
    });

    set({ collections: updated });
    localStorage.setItem('wishlistCollections', JSON.stringify(updated));
  },

  togglePublic: (collectionId: string) => {
    const updated = get().collections.map(col => {
      if (col.id === collectionId) {
        const isPublic = !col.isPublic;
        const shareLink = isPublic
          ? `https://sublet.com/shared/${col.name.toLowerCase().replace(/\s+/g, '-')}-${collectionId}`
          : undefined;

        return {
          ...col,
          isPublic,
          shareLink,
          updatedAt: new Date().toISOString(),
        };
      }
      return col;
    });

    set({ collections: updated });
    localStorage.setItem('wishlistCollections', JSON.stringify(updated));
  },

  generateShareLink: (collectionId: string) => {
    const collection = get().collections.find(col => col.id === collectionId);
    if (!collection) return '';

    if (collection.shareLink) {
      return collection.shareLink;
    }

    const shareLink = `https://sublet.com/shared/${collection.name.toLowerCase().replace(/\s+/g, '-')}-${collectionId}`;
    get().updateCollection(collectionId, { shareLink, isPublic: true });
    return shareLink;
  },
}));
