const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const UserPackage = require('../models/UserPackage');
const auth = require('../middleware/auth');
const moment = require('moment-timezone');

// Get all packages
router.get('/', async (req, res) => {
  try {
    const packages = await Package.find();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Purchase a package - redirect to IPG payment gateway
router.post('/purchase', auth, async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = await Package.findById(packageId);

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Create pending user package (will be activated after payment)
    const userPackage = new UserPackage({
      user: req.user._id,
      package: packageId,
      totalCount: pkg.count,
      remainingCount: 0, // Will be set after payment
      status: 'pending' // Add status field
    });

    await userPackage.save();

    // Return payment gateway URL (IPG)
    // In production, generate actual IPG payment URL with userPackage._id as orderId
    const paymentUrl = `${process.env.IPG_BASE_URL || 'https://payment.example.com'}/payment?` +
      `orderId=${userPackage._id}&` +
      `amount=${pkg.price}&` +
      `callback=${encodeURIComponent(process.env.IPG_CALLBACK_URL || (process.env.FRONTEND_URL ? process.env.FRONTEND_URL + '/packages/payment-callback' : 'https://smokava.com/packages/payment-callback'))}`;

    res.json({
      paymentUrl,
      userPackageId: userPackage._id,
      amount: pkg.price
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Payment callback - activate package after successful payment
router.post('/payment-callback', auth, async (req, res) => {
  try {
    const { userPackageId, transactionId, status } = req.body;

    if (status !== 'success') {
      return res.status(400).json({ message: 'Payment failed' });
    }

    const userPackage = await UserPackage.findOne({
      _id: userPackageId,
      user: req.user._id
    }).populate('package');

    if (!userPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Activate package
    userPackage.remainingCount = userPackage.totalCount;
    userPackage.status = 'active';

    // Initialize restaurant allocations if package has them (bundle package)
    if (userPackage.package && userPackage.package.restaurantAllocations && userPackage.package.restaurantAllocations.length > 0) {
      userPackage.restaurantAllocations = userPackage.package.restaurantAllocations.map(allocation => ({
        restaurant: allocation.restaurant,
        totalCount: allocation.count,
        remainingCount: allocation.count
      }));
    }

    // Calculate expiry date from package durationDays
    if (userPackage.package && userPackage.package.durationDays) {
      const expiryDate = new Date(userPackage.purchasedAt);
      expiryDate.setDate(expiryDate.getDate() + userPackage.package.durationDays);
      userPackage.expiresAt = expiryDate;
    }

    await userPackage.save();

    res.json({ message: 'Package activated successfully', userPackage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's packages
router.get('/my-packages', auth, async (req, res) => {
  try {
    const userPackages = await UserPackage.find({ user: req.user._id })
      .populate('package')
      .populate('giftFromRestaurantId', 'nameFa addressFa')
      .populate('operatorId', 'firstName lastName')
      .populate('history.restaurant')
      .sort({ purchasedAt: -1 });

    res.json(userPackages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate OTP for shisha consumption
router.post('/generate-consumption-otp', auth, async (req, res) => {
  try {
    const { restaurantId, count = 1 } = req.body;
    const User = require('../models/User');
    const { generateOTP } = require('../services/kavenegar');

    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    // Check if user has enough shisha credits
    const userPackages = await UserPackage.find({
      user: req.user._id,
      remainingCount: { $gt: 0 }
    });

    const totalRemaining = userPackages.reduce((sum, pkg) => sum + pkg.remainingCount, 0);

    if (totalRemaining < count) {
      return res.status(400).json({ message: 'Not enough shisha credits remaining' });
    }

    // Generate 5-digit OTP
    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save OTP to user (ensure it's a string and 5 digits)
    const user = await User.findById(req.user._id);
    const normalizedOtp = String(otpCode).padStart(5, '0');
    user.consumptionOtp = normalizedOtp;
    user.consumptionOtpExpiresAt = otpExpiresAt;
    user.consumptionOtpRestaurant = restaurantId;
    user.consumptionOtpCount = count;
    user.consumptionOtpUsed = false; // Reset used flag
    await user.save();

    res.json({
      otpCode: String(normalizedOtp), // Ensure it's always a string
      expiresAt: otpExpiresAt,
      restaurantId,
      count
    });
  } catch (error) {
    console.error('Generate consumption OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP and consume shisha (for restaurants)
router.post('/verify-consumption-otp', async (req, res) => {
  try {
    const { phoneNumber, otpCode } = req.body;
    const User = require('../models/User');
    const Restaurant = require('../models/Restaurant');

    if (!phoneNumber || !otpCode) {
      return res.status(400).json({ message: 'Phone number and OTP code are required' });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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

    // Get restaurant
    const restaurant = await Restaurant.findById(user.consumptionOtpRestaurant);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Find user packages with remaining credits
    const userPackages = await UserPackage.find({
      user: user._id,
      remainingCount: { $gt: 0 },
      status: 'active'
    }).populate('package').sort({ purchasedAt: 1 }); // Use oldest packages first

    // Validate expiry for each package and check restaurant allocations
    const now = new Date();
    const validPackages = [];
    const restaurantId = user.consumptionOtpRestaurant;

    for (const userPackage of userPackages) {
      // Check if package has expired
      if (userPackage.expiresAt && now > new Date(userPackage.expiresAt)) {
        // Package expired - update status
        userPackage.status = 'expired';
        await userPackage.save();
        continue; // Skip expired packages
      }

      // Check if package has restaurant allocations (bundle package)
      if (userPackage.restaurantAllocations && userPackage.restaurantAllocations.length > 0) {
        // Find allocation for this restaurant
        const allocation = userPackage.restaurantAllocations.find((alloc, index) => {
          const allocRestaurantId = alloc.restaurant?._id
            ? alloc.restaurant._id.toString()
            : alloc.restaurant?.toString()
            ? alloc.restaurant.toString()
            : null;
          return allocRestaurantId === restaurantId.toString();
        });

        if (allocation && allocation.remainingCount > 0) {
          // Package has allocation for this restaurant
          const allocationIndex = userPackage.restaurantAllocations.findIndex((alloc, idx) => {
            const allocRestaurantId = alloc.restaurant?._id
              ? alloc.restaurant._id.toString()
              : alloc.restaurant?.toString()
              ? alloc.restaurant.toString()
              : null;
            return allocRestaurantId === restaurantId.toString();
          });
          validPackages.push({
            userPackage,
            availableCount: allocation.remainingCount,
            allocationIndex: allocationIndex
          });
        }
      } else {
        // Legacy: No restaurant allocations, check if package.restaurant matches
        // Or if package has no restaurant restriction (global package)
        const packageRestaurant = userPackage.package?.restaurant;
        const packageRestaurantId = packageRestaurant?._id
          ? packageRestaurant._id.toString()
          : packageRestaurant?.toString()
          ? packageRestaurant.toString()
          : null;
        if (!packageRestaurantId || packageRestaurantId === restaurantId.toString()) {
          // Package can be used at this restaurant
          validPackages.push({
            userPackage,
            availableCount: userPackage.remainingCount,
            allocationIndex: null // No specific allocation
          });
        }
      }
    }

    if (validPackages.length === 0) {
      return res.status(403).json({
        message: 'این بسته در این رستوران قابل استفاده نیست یا اعتبار آن به پایان رسیده است',
        reason: 'No active packages available for this restaurant'
      });
    }

    let remainingToDeduct = user.consumptionOtpCount;
    const consumedPackages = [];
    const mongoose = require('mongoose');
    const redeemLogId = new mongoose.Types.ObjectId(); // Generate unique ID for this redemption

    // Deduct from packages (use validPackages instead of userPackages)
    for (const { userPackage, availableCount, allocationIndex } of validPackages) {
      if (remainingToDeduct <= 0) break;

      const deductCount = Math.min(remainingToDeduct, availableCount);

      // Update restaurant allocation if it exists
      if (allocationIndex !== null && userPackage.restaurantAllocations[allocationIndex]) {
        userPackage.restaurantAllocations[allocationIndex].remainingCount -= deductCount;
      }

      // Update overall remaining count
      userPackage.remainingCount -= deductCount;

      // Add to history
      userPackage.history.push({
        restaurant: restaurantId,
        count: deductCount,
        flavor: '',
        consumedAt: new Date(),
        redeemLogId: redeemLogId // Add redeemLogId for rating tracking
      });

      await userPackage.save();
      consumedPackages.push({
        packageId: userPackage._id,
        count: deductCount
      });

      remainingToDeduct -= deductCount;
    }

    if (remainingToDeduct > 0) {
      return res.status(400).json({ message: 'Not enough credits available' });
    }

    // Mark OTP as used and clear it
    user.consumptionOtp = null;
    user.consumptionOtpExpiresAt = null;
    user.consumptionOtpRestaurant = null;
    user.consumptionOtpCount = 0;
    user.consumptionOtpUsed = true;
    await user.save();

    // Check if rating already exists for this redemption
    const Rating = require('../models/Rating');
    const existingRating = await Rating.findOne({ userId: user._id, redeemLogId });

    res.json({
      message: 'Shisha consumed successfully',
      restaurant: {
        name: restaurant.nameFa,
        _id: restaurant._id
      },
      count: user.consumptionOtpCount,
      consumedPackages,
      redeemLogId: redeemLogId.toString(),
      requiresRating: !existingRating // True if rating is required
    });
  } catch (error) {
    console.error('Verify consumption OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Redeem shisha (consume) - legacy endpoint
router.post('/redeem', auth, async (req, res) => {
  try {
    const { userPackageId, restaurantId, count = 1, flavor = '' } = req.body;

    const userPackage = await UserPackage.findOne({
      _id: userPackageId,
      user: req.user._id
    });

    if (!userPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    if (userPackage.remainingCount < count) {
      return res.status(400).json({ message: 'Not enough shisha remaining' });
    }

    // Validate time windows
    const now = moment.tz('Asia/Tehran');
    if (userPackage.startDate && now.isBefore(moment(userPackage.startDate).tz('Asia/Tehran'))) {
      return res.status(403).json({ message: 'Package not active yet' });
    }
    if (userPackage.endDate && now.isAfter(moment(userPackage.endDate).tz('Asia/Tehran'))) {
      return res.status(403).json({ message: 'Package expired' });
    }

    if (userPackage.timeWindows && userPackage.timeWindows.length > 0) {
      const currentTime = now.format('HH:mm');
      let inWindow = false;

      for (const window of userPackage.timeWindows) {
        const windowStart = window.start;
        const windowEnd = window.end;

        if (windowStart <= windowEnd) {
          inWindow = currentTime >= windowStart && currentTime <= windowEnd;
        } else {
          inWindow = currentTime >= windowStart || currentTime <= windowEnd;
        }

        if (inWindow) break;
      }

      if (!inWindow) {
        return res.status(403).json({
          message: 'این بسته در این ساعت فعال نیست',
          reason: 'Package can only be used during specified time windows'
        });
      }
    }

    userPackage.remainingCount -= count;
    userPackage.history.push({
      restaurant: restaurantId,
      count,
      flavor,
      consumedAt: new Date()
    });

    await userPackage.save();
    res.json(userPackage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get remaining time for a user package
router.get('/wallet/:userId/packages/:id/remaining-time', auth, async (req, res) => {
  try {
    const { userId, id } = req.params;

    // Verify user can access this package
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const userPackage = await UserPackage.findOne({
      _id: id,
      user: userId
    }).populate('package', 'nameFa count');

    if (!userPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    const now = new Date();
    let status = 'active';
    let remainingDays = null;
    let expiresAt = userPackage.expiresAt || null;

    // Calculate remaining days if package has expiry
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (now > expiryDate) {
        status = 'expired';
        remainingDays = 0;
      } else {
        const diffTime = expiryDate - now;
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    const summary = {
      remainingTokens: userPackage.remainingCount,
      totalTokens: userPackage.totalCount,
      status,
      remainingDays,
      expiresAt,
      purchasedAt: userPackage.purchasedAt
    };

    res.json(summary);
  } catch (error) {
    console.error('Get remaining time error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
