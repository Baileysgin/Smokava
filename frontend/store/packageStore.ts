import { create } from 'zustand';
import api from '@/lib/api';

export interface Package {
  _id: string;
  name: string;
  nameFa: string;
  count: number;
  price: number;
  badge?: 'popular' | 'special' | null;
  description?: string;
}

export interface UserPackage {
  _id: string;
  user: string;
  package: Package;
  totalCount: number;
  remainingCount: number;
  purchasedAt: string;
  history: Array<{
    restaurant: {
      _id: string;
      nameFa: string;
      addressFa?: string;
    };
    count: number;
    flavor?: string;
    consumedAt: string;
  }>;
}

interface PackageState {
  packages: Package[];
  userPackages: UserPackage[];
  loading: boolean;
  fetchPackages: () => Promise<void>;
  fetchUserPackages: () => Promise<void>;
  purchasePackage: (packageId: string) => Promise<{ paymentUrl: string; userPackageId: string; amount: number }>;
  generateConsumptionOtp: (restaurantId: string, count?: number) => Promise<{ otpCode: string; expiresAt: string; restaurantId: string; count: number }>;
  redeemShisha: (userPackageId: string, restaurantId: string, count?: number) => Promise<void>;
}

export const usePackageStore = create<PackageState>((set, get) => ({
  packages: [],
  userPackages: [],
  loading: false,

  fetchPackages: async () => {
    try {
      const response = await api.get('/packages');
      set({ packages: response.data });
    } catch (error) {
      console.error('Fetch packages error:', error);
    }
  },

  fetchUserPackages: async () => {
    try {
      set({ loading: true });
      const response = await api.get('/packages/my-packages');
      set({ userPackages: response.data, loading: false });
    } catch (error) {
      console.error('Fetch user packages error:', error);
      set({ loading: false });
    }
  },

  purchasePackage: async (packageId: string) => {
    try {
      const response = await api.post('/packages/purchase', { packageId });
      // Return payment URL to redirect to IPG gateway
      return response.data;
    } catch (error) {
      console.error('Purchase package error:', error);
      throw error;
    }
  },

  generateConsumptionOtp: async (restaurantId: string, count: number = 1) => {
    try {
      const response = await api.post('/packages/generate-consumption-otp', {
        restaurantId,
        count
      });
      // Ensure OTP is always 5 digits as string
      if (response.data.otpCode) {
        response.data.otpCode = String(response.data.otpCode).padStart(5, '0');
      }
      return response.data;
    } catch (error) {
      console.error('Generate consumption OTP error:', error);
      throw error;
    }
  },

  redeemShisha: async (userPackageId: string, restaurantId: string, count = 1) => {
    try {
      await api.post('/packages/redeem', { userPackageId, restaurantId, count });
      await get().fetchUserPackages();
    } catch (error) {
      console.error('Redeem shisha error:', error);
      throw error;
    }
  },
}));
