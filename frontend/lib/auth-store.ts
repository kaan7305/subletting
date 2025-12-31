import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone?: string;
  userType: string;
  emailVerified: boolean;
  studentVerified: boolean;
  profilePhotoUrl?: string;
  bio?: string;
  createdAt?: string;
  is_admin?: boolean;
  is_host?: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accessToken: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock authentication - accept any email/password for demo
      const mockUser: User = {
        id: 'user-' + Date.now(),
        email: credentials.email,
        firstName: credentials.email.split('@')[0].charAt(0).toUpperCase() + credentials.email.split('@')[0].slice(1),
        lastName: 'User',
        name: credentials.email.split('@')[0],
        phone: '+1 (555) 123-4567',
        userType: 'student',
        emailVerified: true,
        studentVerified: true,
        is_host: true,
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock-token-' + Date.now();

      set({
        user: mockUser,
        accessToken: mockToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Store user and token in localStorage
      localStorage.setItem('accessToken', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error: any) {
      set({
        error: error.message || 'Login failed. Please try again.',
        isLoading: false,
        isAuthenticated: false,
        user: null,
        accessToken: null,
      });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock registration - accept any data for demo
      const mockUser: User = {
        id: 'user-' + Date.now(),
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`,
        phone: data.phone,
        userType: data.userType || 'student',
        emailVerified: false,
        studentVerified: false,
        is_host: false,
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock-token-' + Date.now();

      set({
        user: mockUser,
        accessToken: mockToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Store user and token in localStorage
      localStorage.setItem('accessToken', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error: any) {
      set({
        error: error.message || 'Registration failed. Please try again.',
        isLoading: false,
        isAuthenticated: false,
        user: null,
        accessToken: null,
      });
      throw error;
    }
  },

  logout: async () => {
    // Clear localStorage and state
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  loadUser: async () => {
    const accessToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (!accessToken || !storedUser) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      // For mock authentication, just load from localStorage
      const user = JSON.parse(storedUser);

      set({
        user,
        accessToken,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      set({ isAuthenticated: false, user: null, accessToken: null });
    }
  },

  refreshToken: async () => {
    try {
      // For mock authentication, just reload from localStorage
      await get().loadUser();
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
      });
    }
  },

  updateUser: (data: Partial<User>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },

  clearError: () => set({ error: null }),
}));
