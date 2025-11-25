import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  _id: string;
  phoneNumber: string;
  telegramId?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  bio?: string;
  // Legacy fields for backward compatibility
  name?: string;
  avatar?: string;
  isPrivate?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  following: User[];
  login: (phoneNumber: string) => Promise<void>;
  telegramLogin: (telegramData: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  fetchFollowing: () => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  syncTelegramContacts: (phoneNumbers: string[]) => Promise<User[]>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Load from localStorage on initialization
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      // Try to get user info from token or fetch it
      api.get('/auth/me').then((response: any) => {
        set({ user: response.data, token, isAuthenticated: true });
      }).catch(() => {
        localStorage.removeItem('token');
      });
    }
  }

  return {
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
    following: [],

    login: async (phoneNumber: string) => {
      try {
        const response = await api.post('/auth/login', { phoneNumber });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },

    telegramLogin: async (telegramData: any) => {
      try {
        const initData = telegramData.initData || telegramData;
        const userData = telegramData.user || {};

        // Extract phone number from Telegram WebApp
        const phoneNumber = userData.phone_number || initData.user?.phone_number;

        if (!phoneNumber) {
          throw new Error('Phone number not found in Telegram data');
        }

        const response = await api.post('/auth/telegram-login', {
          phoneNumber,
          telegramId: userData.id || initData.user?.id,
          firstName: userData.first_name || initData.user?.first_name || '',
          lastName: userData.last_name || initData.user?.last_name || '',
          username: userData.username || initData.user?.username || '',
          photoUrl: userData.photo_url || initData.user?.photo_url || ''
        });

        const { token, user } = response.data;
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      } catch (error) {
        console.error('Telegram login error:', error);
        throw error;
      }
    },

    logout: () => {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    },

    setUser: (user: User) => {
      set({ user, isAuthenticated: true });
    },

    updateUser: async (updates: Partial<User>) => {
      try {
        const response = await api.put('/users/profile', updates);
        set({ user: response.data });
      } catch (error) {
        console.error('Update user error:', error);
        throw error;
      }
    },

    fetchFollowing: async () => {
      try {
        const response = await api.get('/users/following');
        set({ following: response.data });
      } catch (error) {
        console.error('Fetch following error:', error);
      }
    },

    followUser: async (userId: string) => {
      try {
        await api.post(`/users/follow/${userId}`);
        await get().fetchFollowing();
      } catch (error) {
        console.error('Follow user error:', error);
        throw error;
      }
    },

    syncTelegramContacts: async (phoneNumbers: string[]) => {
      try {
        const response = await api.post('/users/contacts', { phoneNumbers });
        return response.data;
      } catch (error) {
        console.error('Sync contacts error:', error);
        throw error;
      }
    },
  };
});
