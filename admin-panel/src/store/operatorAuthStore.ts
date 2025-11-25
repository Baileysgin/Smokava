import { create } from 'zustand';
import api from '../lib/api';

interface Operator {
  _id: string;
  phoneNumber: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  assignedRestaurant?: {
    _id: string;
    nameFa: string;
    addressFa: string;
  };
}

interface OperatorAuthState {
  operator: Operator | null;
  token: string | null;
  isAuthenticated: boolean;
  sendOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, otpCode: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useOperatorAuthStore = create<OperatorAuthState>((set) => ({
  operator: null,
  token: null,
  isAuthenticated: false,

  sendOtp: async (phoneNumber: string) => {
    try {
      await api.post('/auth/send-otp', { phoneNumber });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send OTP';
      throw new Error(errorMessage);
    }
  },

  verifyOtp: async (phoneNumber: string, otpCode: string) => {
    try {
      const response = await api.post('/auth/verify-otp', { phoneNumber, otpCode });
      const { token, user } = response.data;

      // Development bypass: Allow test code 111111 even if user doesn't have operator role
      const isTestCode = otpCode === '111111';

      // Check if user is a restaurant operator (unless using test code)
      if (!isTestCode && user.role !== 'restaurant_operator') {
        throw new Error('این شماره تلفن برای اپراتور رستوران ثبت نشده است');
      }

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('operatorToken', token);

      set({
        token,
        operator: user,
        isAuthenticated: true,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    localStorage.removeItem('operatorToken');
    set({
      token: null,
      operator: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('operatorToken');
    if (token) {
      try {
        // Fetch user data to verify token and get operator info
        const response = await api.get('/auth/me');
        const user = response.data;

        // Verify user is a restaurant operator
        if (user.role === 'restaurant_operator') {
          set({
            token,
            operator: user,
            isAuthenticated: true,
          });
        } else {
          // Not an operator, clear token
          localStorage.removeItem('operatorToken');
          set({
            token: null,
            operator: null,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        // Token invalid, clear it
        localStorage.removeItem('operatorToken');
        set({
          token: null,
          operator: null,
          isAuthenticated: false,
        });
      }
    }
  },
}));
