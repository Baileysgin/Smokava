import api from '../lib/api';
import type {
  DashboardStats,
  Restaurant,
  ConsumedItem,
  User,
  SoldPackage,
  UserDetails,
  RevenueAnalytics,
  RevenuePerPackage,
  RevenuePerRestaurant,
  DailySales,
  MonthlySales,
  PackageUsage,
  RestaurantUsage,
  RestaurantPayment,
  RestaurantPaymentSummary,
} from '../types/admin';

export type {
  DashboardStats,
  Restaurant,
  ConsumedItem,
  User,
  SoldPackage,
  UserDetails,
  RevenueAnalytics,
  RevenuePerPackage,
  RevenuePerRestaurant,
  DailySales,
  MonthlySales,
  PackageUsage,
  RestaurantUsage,
  RestaurantPayment,
  RestaurantPaymentSummary,
};

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

  // New role management endpoints
  assignRole: async (userId: string, roleName: string, restaurantId?: string): Promise<any> => {
    const response = await api.post(`/admin/users/${userId}/roles`, {
      roleNames: [roleName],
      restaurantId,
    });
    return response.data;
  },

  revokeRole: async (userId: string, roleName: string, restaurantId?: string): Promise<any> => {
    const params = restaurantId ? { restaurantId } : {};
    await api.delete(`/admin/users/${userId}/roles/${roleName}`, { params });
    return { message: 'Role revoked successfully' };
  },

  getUserRoles: async (userId: string): Promise<any> => {
    const response = await api.get(`/admin/users/${userId}/roles`);
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

  // Accounting - Revenue Analytics
  getRevenueAnalytics: async (): Promise<RevenueAnalytics> => {
    const response = await api.get('/accounting/analytics/revenue');
    return response.data;
  },

  getRevenuePerPackage: async (): Promise<RevenuePerPackage[]> => {
    const response = await api.get('/accounting/analytics/revenue-per-package');
    return response.data;
  },

  getRevenuePerRestaurant: async (): Promise<RevenuePerRestaurant[]> => {
    const response = await api.get('/accounting/analytics/revenue-per-restaurant');
    return response.data;
  },

  getDailySales: async (): Promise<DailySales[]> => {
    const response = await api.get('/accounting/analytics/daily-sales');
    return response.data;
  },

  getMonthlySales: async (): Promise<MonthlySales[]> => {
    const response = await api.get('/accounting/analytics/monthly-sales');
    return response.data;
  },

  // Accounting - Package Usage
  getUserPackageUsage: async (userId: string): Promise<PackageUsage[]> => {
    const response = await api.get(`/accounting/usage/user/${userId}`);
    return response.data;
  },

  getRestaurantUsage: async (restaurantId: string): Promise<RestaurantUsage> => {
    const response = await api.get(`/accounting/usage/restaurant/${restaurantId}`);
    return response.data;
  },

  // Accounting - Restaurant Payments
  getRestaurantPayments: async (status?: string, restaurantId?: string): Promise<RestaurantPayment[]> => {
    const params: any = {};
    if (status) params.status = status;
    if (restaurantId) params.restaurantId = restaurantId;
    const response = await api.get('/accounting/restaurant-payments', { params });
    return response.data;
  },

  markPaymentAsPaid: async (paymentId: string, paymentReference?: string): Promise<RestaurantPayment> => {
    const response = await api.post(`/accounting/restaurant-payments/${paymentId}/paid`, {
      paymentReference,
    });
    return response.data;
  },

  getRestaurantPaymentSummary: async (): Promise<RestaurantPaymentSummary[]> => {
    const response = await api.get('/accounting/restaurant-payments/summary');
    return response.data;
  },

  // Settlement
  settleAllPayments: async (notes?: string): Promise<any> => {
    const response = await api.post('/accounting/settle-all', { notes });
    return response.data;
  },

  getSettlements: async (page = 1, limit = 20): Promise<any> => {
    const response = await api.get('/accounting/settlements', {
      params: { page, limit },
    });
    return response.data;
  },

  getSettlementById: async (id: string): Promise<any> => {
    const response = await api.get(`/accounting/settlements/${id}`);
    return response.data;
  },

  // Shared Profiles
  getSharedProfiles: async (page = 1, limit = 20, search?: string): Promise<any> => {
    const params: any = { page, limit };
    if (search) params.search = search;
    const response = await api.get('/admin/shared-profiles', { params });
    return response.data;
  },

  deleteSharedProfile: async (userId: string): Promise<void> => {
    await api.delete(`/admin/shared-profiles/${userId}`);
  },
};
