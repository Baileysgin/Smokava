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
  package?: Package;
  isGift?: boolean;
  giftFromRestaurantId?: {
    _id: string;
    nameFa: string;
    addressFa?: string;
  };
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
    redeemLogId?: string;
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
  submitRating: (data: { restaurantId: string; operatorId?: string; packageId?: string; redeemLogId: string; rating: number; isGift?: boolean }) => Promise<void>;
  getPendingRating: () => Promise<{ pending: { redeemLogId: string; restaurantId: string; restaurantName: string; operatorId?: string; packageId: string; isGift: boolean; consumedAt: string } | null; count: number }>;
  getUnratedConsumptions: () => Promise<{ consumptions: Array<{ redeemLogId: string; restaurantId: string; restaurantName: string; operatorId?: string; packageId: string; isGift: boolean; consumedAt: string; count: number; flavor: string }>; count: number }>;
  getPackageRemainingTime: (userId: string, packageId: string) => Promise<any>;
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

  submitRating: async (data: { restaurantId: string; operatorId?: string; packageId?: string; redeemLogId: string; rating: number; isGift?: boolean }) => {
    try {
      await api.post('/rating/submit', data);
    } catch (error) {
      console.error('Submit rating error:', error);
      throw error;
    }
  },

  getPendingRating: async () => {
    try {
      const response = await api.get('/rating/pending');
      return response.data;
    } catch (error) {
      console.error('Get pending rating error:', error);
      throw error;
    }
  },

  getUnratedConsumptions: async () => {
    try {
      const response = await api.get('/rating/unrated-consumptions');
      return response.data;
    } catch (error) {
      console.error('Get unrated consumptions error:', error);
      throw error;
    }
  },

  getPackageRemainingTime: async (userId: string, packageId: string) => {
    try {
      const response = await api.get(`/packages/wallet/${userId}/packages/${packageId}/remaining-time`);
      return response.data;
    } catch (error) {
      console.error('Get package remaining time error:', error);
      throw error;
    }
  },
}));
