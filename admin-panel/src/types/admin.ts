export type DashboardStats = {
  totalUsers: number;
  totalRestaurants: number;
  totalPosts: number;
  totalPackages: number;
  totalConsumed: number;
  recentUsers: number;
};

export type Restaurant = {
  _id: string;
  name: string;
  nameFa: string;
  address: string;
  addressFa: string;
  phone: string;
  city: string;
  description: string;
  active: boolean;
  image: string;
  imageUrl?: string;
  location: {
    type: string;
    coordinates: number[];
  };
  createdAt?: string;
};

export type ConsumedItem = {
  id: string;
  user: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  package: {
    _id: string;
    nameFa: string;
    count: number;
    price: number;
  };
  restaurant: {
    _id: string;
    nameFa: string;
    addressFa: string;
  };
  count: number;
  flavor: string;
  consumedAt: string;
};

export type User = {
  _id: string;
  name: string;
  phoneNumber: string;
  avatar: string;
  createdAt: string;
  role?: 'user' | 'restaurant_operator' | 'admin';
  assignedRestaurant?: {
    _id: string;
    nameFa: string;
    addressFa?: string;
  };
};

export type SoldPackage = {
  _id: string;
  user: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  package: {
    _id: string;
    nameFa: string;
    count: number;
    price: number;
  };
  totalCount: number;
  remainingCount: number;
  consumedCount: number;
  purchasedAt: string;
};

export type UserDetails = {
  user: User;
  packages: any[];
  posts: any[];
  stats: {
    totalPackages: number;
    totalConsumed: number;
    restaurantsVisited: number;
    totalPosts: number;
  };
};
