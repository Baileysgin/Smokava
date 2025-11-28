const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const requireOperator = require('../middleware/operatorAuth');
const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const Restaurant = require('../models/Restaurant');
const Rating = require('../models/Rating');
const { generateOTP } = require('../services/kavenegar');

// Simple in-memory cache for operator dashboard (3 minutes)
const cache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCached = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Redeem package using OTP (for restaurant operators)
router.post('/redeem', requireOperator, async (req, res) => {
  try {
    const { phoneNumber, otpCode, count = 1, flavor = '' } = req.body;
    const operatorRestaurantId = req.user.assignedRestaurant?._id || req.user.assignedRestaurant;

    if (!phoneNumber || !otpCode) {
      return res.status(400).json({ message: 'Phone number and OTP code are required' });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    // Verify OTP exists
    if (!user.consumptionOtp || !user.consumptionOtpExpiresAt) {
      return res.status(400).json({ message: 'کد وارد شده نامعتبر است' });
    }

    // Check if OTP has been used
    if (user.consumptionOtpUsed) {
      return res.status(400).json({ message: 'این کد قبلاً استفاده شده است' });
    }

    // Check if OTP has expired
    if (new Date() > user.consumptionOtpExpiresAt) {
      return res.status(400).json({ message: 'کد منقضی شده است' });
    }

    // Normalize OTP codes (5 digits)
    const storedOtpStr = String(user.consumptionOtp || '').trim().padStart(5, '0');
    const inputOtpStr = String(otpCode || '').trim().replace(/\D/g, '').padStart(5, '0');

    if (storedOtpStr !== inputOtpStr) {
      return res.status(400).json({ message: 'کد وارد شده نامعتبر است' });
    }

    // Verify OTP is for this restaurant
    const otpRestaurantId = user.consumptionOtpRestaurant?.toString();
    if (otpRestaurantId !== operatorRestaurantId.toString()) {
      return res.status(403).json({
        message: 'این کد برای این رستوران معتبر نیست',
        message: 'This OTP is not valid for your restaurant'
      });
    }

    // Get restaurant
    const restaurant = await Restaurant.findById(operatorRestaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Find user packages with remaining credits (including gift packages)
    const userPackages = await UserPackage.find({
      user: user._id,
      remainingCount: { $gt: 0 }
    }).sort({ purchasedAt: 1 }); // Use oldest packages first

    const redeemCount = count || user.consumptionOtpCount || 1;
    let remainingToDeduct = redeemCount;
    const consumedPackages = [];
    const redeemLogId = new mongoose.Types.ObjectId(); // Generate unique ID for this redemption

    // Deduct from packages
    for (const userPackage of userPackages) {
      if (remainingToDeduct <= 0) break;

      const deductCount = Math.min(remainingToDeduct, userPackage.remainingCount);
      userPackage.remainingCount -= deductCount;
      userPackage.history.push({
        restaurant: operatorRestaurantId,
        count: deductCount,
        flavor: flavor || '',
        consumedAt: new Date(),
        redeemLogId: redeemLogId
      });

      await userPackage.save();
      consumedPackages.push({
        packageId: userPackage._id,
        count: deductCount,
        isGift: userPackage.isGift || false
      });

      remainingToDeduct -= deductCount;
    }

    if (remainingToDeduct > 0) {
      return res.status(400).json({ message: 'اعتبار کافی موجود نیست' });
    }

    // Mark OTP as used and clear it
    user.consumptionOtp = null;
    user.consumptionOtpExpiresAt = null;
    user.consumptionOtpRestaurant = null;
    user.consumptionOtpCount = 0;
    user.consumptionOtpUsed = true;
    await user.save();

    // Check if rating already exists for this redemption
    const existingRating = await Rating.findOne({ userId: user._id, redeemLogId });

    res.json({
      message: 'Package redeemed successfully',
      restaurant: {
        name: restaurant.nameFa,
        _id: restaurant._id
      },
      operatorId: req.user._id,
      count: redeemCount,
      consumedPackages,
      redeemLogId: redeemLogId.toString(),
      requiresRating: !existingRating, // True if rating is required
      user: {
        name: user.name || user.firstName || user.phoneNumber,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Operator redeem error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get consumption history for operator's restaurant
router.get('/history', requireOperator, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const operatorRestaurantId = req.user.assignedRestaurant?._id || req.user.assignedRestaurant;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.consumedAt = {};
      if (startDate) {
        dateFilter.consumedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.consumedAt.$lte = new Date(endDate);
      }
    }

    // Get all user packages with history for this restaurant
    const userPackages = await UserPackage.find({
      'history.restaurant': operatorRestaurantId
    })
      .populate('user', 'name firstName lastName phoneNumber')
      .populate('package', 'nameFa count price')
      .populate('history.restaurant', 'nameFa addressFa');

    // Get all redeemLogIds from history
    const redeemLogIds = [];
    userPackages.forEach(userPackage => {
      if (userPackage.history && userPackage.history.length > 0) {
        userPackage.history.forEach(item => {
          if (item.redeemLogId) {
            redeemLogIds.push(item.redeemLogId);
          }
        });
      }
    });

    // Get ratings for these redemptions
    const ratings = await Rating.find({ redeemLogId: { $in: redeemLogIds } });
    const ratingMap = {};
    ratings.forEach(rating => {
      if (rating.redeemLogId) {
        ratingMap[rating.redeemLogId.toString()] = rating.rating;
      }
    });

    // Flatten history for this restaurant
    const historyItems = [];
    userPackages.forEach(userPackage => {
      if (userPackage.history && userPackage.history.length > 0) {
        userPackage.history.forEach(item => {
          const itemRestaurantId = item.restaurant?._id?.toString() || item.restaurant?.toString();
          if (itemRestaurantId === operatorRestaurantId.toString()) {
            // Apply date filter if provided
            if (dateFilter.consumedAt) {
              const consumedDate = new Date(item.consumedAt);
              if (startDate && consumedDate < new Date(startDate)) return;
              if (endDate && consumedDate > new Date(endDate)) return;
            }
            const redeemLogIdStr = item.redeemLogId?.toString();
            historyItems.push({
              id: item._id,
              user: userPackage.user,
              package: userPackage.package,
              restaurant: item.restaurant,
              count: item.count,
              flavor: item.flavor,
              consumedAt: item.consumedAt,
              isGift: userPackage.isGift || false,
              rating: redeemLogIdStr ? (ratingMap[redeemLogIdStr] || null) : null
            });
          }
        });
      }
    });

    // Sort by consumed date (newest first)
    historyItems.sort((a, b) => new Date(b.consumedAt) - new Date(a.consumedAt));

    // Paginate
    const total = historyItems.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    res.json({
      items: historyItems.slice(startIndex, endIndex),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Get operator history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get operator dashboard with enhanced analytics
router.get('/dashboard', requireOperator, async (req, res) => {
  try {
    const operatorRestaurantId = req.user.assignedRestaurant?._id || req.user.assignedRestaurant;
    const cacheKey = `operator-dashboard-${operatorRestaurantId}`;

    // Check cache first
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get restaurant info
    const restaurant = await Restaurant.findById(operatorRestaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Date ranges
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(now);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    monthEnd.setHours(23, 59, 59, 999);

    // Get all user packages with history for this restaurant
    const userPackages = await UserPackage.find({
      'history.restaurant': operatorRestaurantId
    })
      .populate('user', 'name firstName lastName phoneNumber')
      .populate('package', 'nameFa count price')
      .populate('history.restaurant', 'nameFa');

    // Calculate statistics
    let todayRedemptions = 0;
    let weekRedemptions = 0;
    let monthRedemptions = 0;
    const todayItems = [];
    const recentRedemptions = [];
    const uniqueCustomers = new Set();
    const flavorCounts = {};
    const dailyRedemptions = {}; // For chart data

    userPackages.forEach(userPackage => {
      if (userPackage.history && userPackage.history.length > 0) {
        userPackage.history.forEach(item => {
          const itemRestaurantId = item.restaurant?._id?.toString() || item.restaurant?.toString();
          if (itemRestaurantId === operatorRestaurantId.toString()) {
            const consumedDate = new Date(item.consumedAt);
            const dateKey = consumedDate.toISOString().split('T')[0];

            // Track unique customers
            if (userPackage.user?._id) {
              uniqueCustomers.add(userPackage.user._id.toString());
            }

            // Count flavors
            if (item.flavor) {
              flavorCounts[item.flavor] = (flavorCounts[item.flavor] || 0) + item.count;
            }

            // Daily redemption counts for chart
            if (!dailyRedemptions[dateKey]) {
              dailyRedemptions[dateKey] = 0;
            }
            dailyRedemptions[dateKey] += item.count;

            // Today's count
            if (consumedDate >= todayStart && consumedDate <= todayEnd) {
              todayRedemptions += item.count;
              todayItems.push({
                count: item.count,
                consumedAt: item.consumedAt,
                user: userPackage.user,
                flavor: item.flavor
              });
            }

            // Week's count
            if (consumedDate >= weekStart && consumedDate <= todayEnd) {
              weekRedemptions += item.count;
            }

            // Month's count
            if (consumedDate >= monthStart && consumedDate <= monthEnd) {
              monthRedemptions += item.count;
            }

            // Recent redemptions (last 10)
            recentRedemptions.push({
              id: item._id,
              user: userPackage.user,
              package: userPackage.package,
              count: item.count,
              flavor: item.flavor,
              consumedAt: item.consumedAt
            });
          }
        });
      }
    });

    // Sort recent redemptions
    recentRedemptions.sort((a, b) => new Date(b.consumedAt) - new Date(a.consumedAt));
    const last10Redemptions = recentRedemptions.slice(0, 10);

    // Sort flavors by count
    const topFlavors = Object.entries(flavorCounts)
      .map(([flavor, count]) => ({ flavor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate chart data (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      chartData.push({
        date: dateKey,
        day: date.toLocaleDateString('fa-IR', { weekday: 'short' }),
        count: dailyRedemptions[dateKey] || 0
      });
    }

    const dashboardData = {
      restaurant: {
        name: restaurant.nameFa,
        address: restaurant.addressFa,
        _id: restaurant._id,
        image: restaurant.image || restaurant.imageUrl || ''
      },
      stats: {
        todayRedemptions,
        weekRedemptions,
        monthRedemptions,
        todayItemsCount: todayItems.length,
        uniqueCustomers: uniqueCustomers.size,
        topFlavors,
        chartData,
        recentRedemptions: last10Redemptions
      }
    };

    // Cache the result
    setCached(cacheKey, dashboardData);

    res.json(dashboardData);
  } catch (error) {
    console.error('Get operator dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Give gift قلیون to customer (no OTP required)
router.post('/gift', requireOperator, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const operatorRestaurantId = req.user.assignedRestaurant?._id || req.user.assignedRestaurant;
    const operatorId = req.user._id;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'شماره تلفن مشتری الزامی است' });
    }

    // Check if customer exists
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    // Get restaurant
    const restaurant = await Restaurant.findById(operatorRestaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'رستوران یافت نشد' });
    }

    // Create gift package
    const giftPackage = new UserPackage({
      user: user._id,
      isGift: true,
      giftFromRestaurantId: operatorRestaurantId,
      operatorId: operatorId,
      totalCount: 1,
      remainingCount: 1,
      status: 'active',
      purchasedAt: new Date()
    });

    await giftPackage.save();

    res.json({
      message: 'یک قلیون به عنوان هدیه برای کاربر فعال شد.',
      giftPackage: {
        _id: giftPackage._id,
        user: {
          name: user.name || user.firstName || user.phoneNumber,
          phoneNumber: user.phoneNumber
        },
        restaurant: {
          name: restaurant.nameFa,
          _id: restaurant._id
        }
      }
    });
  } catch (error) {
    console.error('Operator gift error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Development helper: Generate consumption OTP for testing
router.post('/generate-test-otp', requireOperator, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Not available in production' });
    }

    const { phoneNumber, count = 1 } = req.body;
    const operatorRestaurantId = req.user.assignedRestaurant?._id || req.user.assignedRestaurant;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has packages
    const userPackages = await UserPackage.find({
      user: user._id,
      remainingCount: { $gt: 0 }
    });

    const totalRemaining = userPackages.reduce((sum, pkg) => sum + pkg.remainingCount, 0);

    if (totalRemaining < count) {
      return res.status(400).json({ message: 'Not enough shisha credits remaining' });
    }

    // Generate OTP (ensure it's always 5 digits)
    const otpCode = generateOTP();
    const normalizedOtp = String(otpCode).padStart(5, '0');
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save OTP to user
    user.consumptionOtp = normalizedOtp;
    user.consumptionOtpExpiresAt = otpExpiresAt;
    user.consumptionOtpRestaurant = operatorRestaurantId;
    user.consumptionOtpCount = count;
    user.consumptionOtpUsed = false; // Reset used flag
    await user.save();

    console.log('\n🔑 ============================================');
    console.log('🔑 TEST OTP GENERATED (Development Mode)');
    console.log('🔑 Phone Number:', phoneNumber);
    console.log('🔑 OTP Code:', normalizedOtp);
    console.log('🔑 Restaurant ID:', operatorRestaurantId);
    console.log('🔑 Count:', count);
    console.log('🔑 Expires at:', otpExpiresAt);
    console.log('🔑 ============================================\n');

    res.json({
      otpCode: normalizedOtp,
      expiresAt: otpExpiresAt,
      restaurantId: operatorRestaurantId,
      count,
      message: 'OTP generated successfully (Development Mode)'
    });
  } catch (error) {
    console.error('Generate test OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
