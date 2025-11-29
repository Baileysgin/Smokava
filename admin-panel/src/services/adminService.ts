import api from '../lib/api';
import type { DashboardStats, Restaurant, ConsumedItem, User, SoldPackage, UserDetails } from '../types/admin';

export type { DashboardStats, Restaurant, ConsumedItem, User, SoldPackage, UserDetails };

export const adminService = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  // Restaurants
  getRestaurants: async (): Promise<Restaurant[]> => {
    const response = await api.get('/admin/restaurants');
    return response.data;
  },

  getRestaurantById: async (id: string): Promise<Restaurant> => {
    const response = await api.get(`/admin/restaurants/${id}`);
    return response.data;
  },

  createRestaurant: async (data: Partial<Restaurant>): Promise<Restaurant> => {
    const response = await api.post('/admin/restaurants', data);
    return response.data;
  },

  updateRestaurant: async (id: string, data: Partial<Restaurant>): Promise<Restaurant> => {
    const response = await api.patch(`/admin/restaurants/${id}`, data);
    return response.data;
  },

  deleteRestaurant: async (id: string): Promise<void> => {
    await api.delete(`/admin/restaurants/${id}`);
  },

  // Consumed Packages
  getConsumedPackages: async (page = 1, limit = 20) => {
    const response = await api.get('/admin/consumed-packages', {
      params: { page, limit },
    });
    return response.data;
  },

  // Sold Packages
  getSoldPackages: async (page = 1, limit = 20) => {
    const response = await api.get('/admin/sold-packages', {
      params: { page, limit },
    });
    return response.data;
  },

  // Users
  getUsers: async (page = 1, limit = 20) => {
    console.log('adminService.getUsers - Making API call to /admin/users');
    const response = await api.get('/admin/users', {
      params: { page, limit },
    });
    return response.data;
  },

  getUserDetails: async (userId: string): Promise<UserDetails> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserRole: async (userId: string, role: string, assignedRestaurant?: string): Promise<any> => {
    const response = await api.patch(`/admin/users/${userId}/role`, {
      role,
      assignedRestaurant,
    });
    return response.data;
  },

  // Package Management
  getPackage: async (): Promise<any> => {
    const response = await api.get('/admin/package');
    return response.data;
  },

  getAllPackages: async (): Promise<any[]> => {
    console.log('adminService.getAllPackages - Making API call to /admin/packages');
    try {
      const response = await api.get('/admin/packages');
      console.log('adminService.getAllPackages - Response received:', {
        status: response.status,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
        data: response.data
      });
      return response.data;
    } catch (error: any) {
      console.error('adminService.getAllPackages - Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        headers: error.config?.headers
      });
      throw error;
    }
  },

  getPackageById: async (id: string): Promise<any> => {
    const response = await api.get(`/admin/package/${id}`);
    return response.data;
  },

  updatePackage: async (id: string | null, data: any): Promise<any> => {
    const response = await api.post('/admin/update-package', { ...data, packageId: id });
    return response.data;
  },

  deletePackage: async (id: string): Promise<void> => {
    await api.delete(`/admin/package/${id}`);
  },

  // Activate Package
  activatePackage: async (userId: string, packageId: string): Promise<any> => {
    const response = await api.post('/admin/activate-package', {
      userId,
      packageId,
    });
    return response.data;
  },
};
