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

// Accounting types
export type RevenueAnalytics = {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalRevenue: number;
  purchaseCount: number;
};

export type RevenuePerPackage = {
  packageId: string;
  packageName: string;
  totalRevenue: number;
  count: number;
};

export type RevenuePerRestaurant = {
  restaurantId: string;
  restaurantName: string;
  totalRevenue: number;
  totalShishaDebt: number;
  totalShishaCredit: number;
  paymentCount: number;
};

export type DailySales = {
  date: string;
  revenue: number;
  count: number;
};

export type MonthlySales = {
  month: string;
  revenue: number;
  count: number;
};

export type PackageUsage = {
  userPackageId: string;
  package: {
    _id: string;
    nameFa: string;
    count: number;
    price: number;
  };
  totalShishaAllowed: number;
  totalShishaUsed: number;
  totalShishaRemaining: number;
  restaurantUsage: Array<{
    restaurant: {
      _id: string;
      nameFa: string;
    };
    totalAllowed: number;
    totalUsed: number;
    totalRemaining: number;
  }>;
  purchasedAt: string;
  status: string;
};

export type RestaurantUsage = {
  restaurantId: string;
  shishaDebt: number;
  shishaCredit: number;
  actualConsumed: number;
  netDebt: number;
  totalPaymentAmount: number;
  payments: Array<{
    paymentId: string;
    amount: number;
    shishaDebt: number;
    shishaCredit: number;
    status: string;
    createdAt: string;
  }>;
};

export type RestaurantPayment = {
  _id: string;
  restaurant: {
    _id: string;
    nameFa: string;
    addressFa?: string;
  };
  userPackage: {
    _id: string;
    user: string;
    package: string;
  };
  transaction: {
    _id: string;
    amount: number;
  };
  amount: number;
  commissionPercentage: number;
  shishaDebt: number;
  shishaCredit: number;
  status: 'pending' | 'due' | 'paid' | 'cancelled';
  paidAt?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
};

export type RestaurantPaymentSummary = {
  restaurantId: string;
  restaurantName: string;
  totalDue: number;
  totalPaid: number;
  totalShishaDebt: number;
  totalShishaCredit: number;
};

export type Settlement = {
  _id: string;
  settlementNumber: string;
  settlementDate: string;
  restaurants: Array<{
    restaurant: any;
    restaurantName: string;
    totalAmount: number;
    totalShishaProvided: number;
    paymentCount: number;
  }>;
  totalAmount: number;
  totalShishaProvided: number;
  totalPaymentsSettled: number;
  restaurantPayments: string[];
  document: {
    generatedAt: string;
    generatedBy: {
      _id: string;
      username: string;
    };
    notes: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
};
