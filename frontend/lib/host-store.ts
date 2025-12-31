import { create } from 'zustand';
import { type Property } from '@/data/properties';

export interface HostProperty extends Omit<Property, 'instantBook' | 'verified'> {
  status: 'active' | 'inactive' | 'pending';
  bookingsCount: number;
  revenue: number;
  views: number;
  averageRating: number;
  reviewsCount: number;
  instantBook?: boolean;
  verified?: boolean;
}

export interface BookingRequest {
  id: string;
  propertyId: number;
  propertyTitle: string;
  propertyImage: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestAvatar?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  requestDate: string;
  message?: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
  bookings: number;
}

interface HostState {
  properties: HostProperty[];
  bookingRequests: BookingRequest[];
  revenueData: RevenueData[];
  totalRevenue: number;
  totalBookings: number;
  activeListings: number;
  loadHostData: () => void;
  addProperty: (property: Omit<HostProperty, 'id'>) => void;
  updateProperty: (id: number, updates: Partial<HostProperty>) => void;
  deleteProperty: (id: number) => void;
  updateBookingRequest: (id: string, status: 'approved' | 'declined') => void;
}

export const useHostStore = create<HostState>((set, get) => ({
  properties: [],
  bookingRequests: [],
  revenueData: [],
  totalRevenue: 0,
  totalBookings: 0,
  activeListings: 0,

  loadHostData: () => {
    // Simulate loading host data
    const mockProperties: HostProperty[] = [
      {
        id: 101,
        title: 'Modern Studio in Downtown',
        location: 'Seattle, WA',
        city: 'Seattle',
        price: 1800,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        beds: 1,
        baths: 1,
        sqft: 650,
        amenities: ['WiFi', 'Kitchen', 'Parking'],
        type: 'Studio',
        duration: '3 months min',
        durationMonths: 3,
        description: 'Modern studio apartment in downtown',
        available: 'Available Now',
        reviews: 15,
        instantBook: true,
        verified: true,
        status: 'active',
        bookingsCount: 12,
        revenue: 21600,
        views: 342,
        averageRating: 4.8,
        reviewsCount: 15,
      },
      {
        id: 102,
        title: 'Cozy 2BR Near Campus',
        location: 'Boston, MA',
        city: 'Boston',
        price: 2400,
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        beds: 2,
        baths: 1,
        sqft: 900,
        amenities: ['WiFi', 'Laundry', 'Heating'],
        type: 'Apartment',
        duration: '6 months min',
        durationMonths: 6,
        description: 'Cozy apartment near campus',
        available: 'Available Now',
        reviews: 10,
        instantBook: false,
        verified: true,
        status: 'active',
        bookingsCount: 8,
        revenue: 19200,
        views: 256,
        averageRating: 4.6,
        reviewsCount: 10,
      },
    ];

    const mockBookingRequests: BookingRequest[] = [
      {
        id: 'req-1',
        propertyId: 101,
        propertyTitle: 'Modern Studio in Downtown',
        propertyImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        guestId: 'guest-1',
        guestName: 'Emma Wilson',
        guestEmail: 'emma@email.com',
        checkIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 97 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        guests: 1,
        totalPrice: 5400,
        status: 'pending',
        requestDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        message: 'Hi! I\'m a graduate student looking for housing near my university. Your place looks perfect!',
      },
      {
        id: 'req-2',
        propertyId: 102,
        propertyTitle: 'Cozy 2BR Near Campus',
        propertyImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        guestId: 'guest-2',
        guestName: 'Alex Johnson',
        guestEmail: 'alex@email.com',
        checkIn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 194 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        guests: 2,
        totalPrice: 14400,
        status: 'pending',
        requestDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        message: 'Looking for a place for me and my roommate. We\'re both international students.',
      },
    ];

    const mockRevenueData: RevenueData[] = [
      { month: 'Jul', revenue: 3200, bookings: 2 },
      { month: 'Aug', revenue: 4800, bookings: 3 },
      { month: 'Sep', revenue: 6400, bookings: 4 },
      { month: 'Oct', revenue: 5600, bookings: 3 },
      { month: 'Nov', revenue: 7200, bookings: 5 },
      { month: 'Dec', revenue: 8800, bookings: 6 },
    ];

    const totalRevenue = mockProperties.reduce((sum, p) => sum + p.revenue, 0);
    const totalBookings = mockProperties.reduce((sum, p) => sum + p.bookingsCount, 0);
    const activeListings = mockProperties.filter(p => p.status === 'active').length;

    set({
      properties: mockProperties,
      bookingRequests: mockBookingRequests,
      revenueData: mockRevenueData,
      totalRevenue,
      totalBookings,
      activeListings,
    });
  },

  addProperty: (property) => {
    const newProperty: HostProperty = {
      ...property,
      id: Date.now(),
      bookingsCount: 0,
      revenue: 0,
      views: 0,
      averageRating: 0,
      reviewsCount: 0,
      status: 'pending',
    };
    set((state) => ({
      properties: [...state.properties, newProperty],
      activeListings: state.properties.filter(p => p.status === 'active').length + 1,
    }));
  },

  updateProperty: (id, updates) => {
    set((state) => ({
      properties: state.properties.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  deleteProperty: (id) => {
    set((state) => ({
      properties: state.properties.filter(p => p.id !== id),
      activeListings: state.properties.filter(p => p.id !== id && p.status === 'active').length,
    }));
  },

  updateBookingRequest: (id, status) => {
    set((state) => ({
      bookingRequests: state.bookingRequests.map(req =>
        req.id === id ? { ...req, status } : req
      ),
    }));
  },
}));
