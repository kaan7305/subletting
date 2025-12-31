import { create } from 'zustand';

export interface Amenity {
  id: string;
  type: 'university' | 'transit' | 'grocery' | 'cafe' | 'gym';
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface MapFilters {
  priceRange: [number, number];
  beds: number[];
  propertyType: string[];
  amenities: string[];
}

interface MapState {
  center: [number, number];
  zoom: number;
  selectedPropertyId: number | null;
  showAmenities: boolean;
  amenityTypes: string[];
  filters: MapFilters;
  drawnArea: [number, number][] | null;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setSelectedProperty: (id: number | null) => void;
  toggleAmenities: () => void;
  setAmenityTypes: (types: string[]) => void;
  setFilters: (filters: Partial<MapFilters>) => void;
  setDrawnArea: (area: [number, number][] | null) => void;
  clearFilters: () => void;
}

// Mock amenities data
export const mockAmenities: Amenity[] = [
  // Universities
  { id: 'u1', type: 'university', name: 'Columbia University', lat: 40.8075, lng: -73.9626 },
  { id: 'u2', type: 'university', name: 'NYU', lat: 40.7295, lng: -73.9965 },
  { id: 'u3', type: 'university', name: 'Harvard University', lat: 42.3744, lng: -71.1169 },
  { id: 'u4', type: 'university', name: 'MIT', lat: 42.3601, lng: -71.0942 },
  { id: 'u5', type: 'university', name: 'Stanford University', lat: 37.4275, lng: -122.1697 },
  { id: 'u6', type: 'university', name: 'UC Berkeley', lat: 37.8719, lng: -122.2585 },

  // Transit stations
  { id: 't1', type: 'transit', name: 'Times Square Station', lat: 40.7580, lng: -73.9855 },
  { id: 't2', type: 'transit', name: 'Grand Central', lat: 40.7527, lng: -73.9772 },
  { id: 't3', type: 'transit', name: 'Harvard Square', lat: 42.3736, lng: -71.1190 },
  { id: 't4', type: 'transit', name: 'Kendall/MIT', lat: 42.3625, lng: -71.0865 },

  // Grocery stores
  { id: 'g1', type: 'grocery', name: 'Whole Foods Market', lat: 40.7614, lng: -73.9776 },
  { id: 'g2', type: 'grocery', name: 'Trader Joe\'s', lat: 40.7282, lng: -73.9942 },
  { id: 'g3', type: 'grocery', name: 'Star Market', lat: 42.3751, lng: -71.1184 },

  // Cafes
  { id: 'c1', type: 'cafe', name: 'Blue Bottle Coffee', lat: 40.7589, lng: -73.9851 },
  { id: 'c2', type: 'cafe', name: 'Starbucks Reserve', lat: 40.7614, lng: -73.9776 },

  // Gyms
  { id: 'gym1', type: 'gym', name: 'Equinox', lat: 40.7614, lng: -73.9776 },
  { id: 'gym2', type: 'gym', name: '24 Hour Fitness', lat: 42.3601, lng: -71.0889 },
];

export const useMapStore = create<MapState>((set) => ({
  center: [40.7589, -73.9851], // Default to Manhattan
  zoom: 12,
  selectedPropertyId: null,
  showAmenities: false,
  amenityTypes: [],
  drawnArea: null,
  filters: {
    priceRange: [0, 10000],
    beds: [],
    propertyType: [],
    amenities: [],
  },

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedProperty: (id) => set({ selectedPropertyId: id }),
  toggleAmenities: () => set((state) => ({ showAmenities: !state.showAmenities })),
  setAmenityTypes: (types) => set({ amenityTypes: types }),
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  setDrawnArea: (area) => set({ drawnArea: area }),
  clearFilters: () => set({
    filters: {
      priceRange: [0, 10000],
      beds: [],
      propertyType: [],
      amenities: [],
    },
    drawnArea: null,
  }),
}));
