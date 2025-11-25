import { create } from 'zustand';
import api from '@/lib/api';

export interface Restaurant {
  _id: string;
  name: string;
  nameFa: string;
  address: string;
  addressFa: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  phone?: string;
  image?: string;
  rating?: number;
  reviews?: number;
  flavors?: number;
  popular?: boolean;
  accepted?: boolean;
  distance?: string;
}

interface RestaurantState {
  restaurants: Restaurant[];
  loading: boolean;
  fetchRestaurants: () => Promise<void>;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  restaurants: [],
  loading: false,

  fetchRestaurants: async () => {
    try {
      set({ loading: true });
      const response = await api.get('/restaurants');
      set({ restaurants: response.data, loading: false });
    } catch (error) {
      console.error('Fetch restaurants error:', error);
      set({ loading: false });
    }
  },
}));
