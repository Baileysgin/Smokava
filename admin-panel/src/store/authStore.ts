import { create } from 'zustand';
import api from '../lib/api';

interface Admin {
  id: string;
  username: string;
}

interface AuthState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  token: null,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    try {
      console.log('🔐 Attempting login with username:', username);
      const response = await api.post('/admin/login', { username, password });
      console.log('✅ Login response received:', { hasToken: !!response.data.token, hasAdmin: !!response.data.admin });

      const { token, admin } = response.data;

      if (!token || !admin) {
        console.error('❌ Invalid login response - missing token or admin');
        throw new Error('Invalid response from server');
      }

      console.log('💾 Saving token to localStorage');
      localStorage.setItem('adminToken', token);

      set({
        token,
        admin,
        isAuthenticated: true,
      });
      console.log('✅ Login successful - user authenticated');
    } catch (error: any) {
      console.error('❌ Auth store login error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    set({
      token: null,
      admin: null,
      isAuthenticated: false,
    });
  },

  checkAuth: () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      set({
        token,
        isAuthenticated: true,
      });
    }
  },
}));
