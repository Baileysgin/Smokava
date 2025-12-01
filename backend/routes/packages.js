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
    });

    if (!userPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Activate package
    userPackage.remainingCount = userPackage.totalCount;
    userPackage.status = 'active';
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
    }).sort({ purchasedAt: 1 }); // Use oldest packages first

    // Validate time windows for each package
    const now = moment.tz('Asia/Tehran');
    const validPackages = [];

    for (const userPackage of userPackages) {
      // Check date range
      if (userPackage.startDate && now.isBefore(moment(userPackage.startDate).tz('Asia/Tehran'))) {
        continue; // Package not started yet
      }
      if (userPackage.endDate && now.isAfter(moment(userPackage.endDate).tz('Asia/Tehran'))) {
        continue; // Package expired
      }

      // Check time windows
      if (userPackage.timeWindows && userPackage.timeWindows.length > 0) {
        const currentTime = now.format('HH:mm');
        let inWindow = false;

        for (const window of userPackage.timeWindows) {
          const windowStart = window.start;
          const windowEnd = window.end;

          // Handle time comparison (e.g., "13:00" to "17:00")
          if (windowStart <= windowEnd) {
            // Normal window (e.g., 13:00 to 17:00)
            inWindow = currentTime >= windowStart && currentTime <= windowEnd;
          } else {
            // Overnight window (e.g., 22:00 to 02:00)
            inWindow = currentTime >= windowStart || currentTime <= windowEnd;
          }

          if (inWindow) break;
        }

        if (!inWindow) {
          // Find next available window
          let nextWindow = null;
          for (const window of userPackage.timeWindows) {
            const windowStart = window.start;
            const today = now.clone().startOf('day');
            const windowStartTime = today.clone().add(windowStart.split(':')[0], 'hours').add(windowStart.split(':')[1], 'minutes');

            if (now.isBefore(windowStartTime)) {
              nextWindow = windowStartTime;
              break;
            }
          }

          // If no window today, use first window tomorrow
          if (!nextWindow && userPackage.timeWindows.length > 0) {
            const firstWindow = userPackage.timeWindows[0];
            nextWindow = now.clone().add(1, 'day').startOf('day')
              .add(firstWindow.start.split(':')[0], 'hours')
              .add(firstWindow.start.split(':')[1], 'minutes');
          }

          return res.status(403).json({
            message: 'این بسته در این ساعت فعال نیست',
            reason: 'Package can only be used during specified time windows',
            nextAvailableWindow: nextWindow ? nextWindow.toISOString() : null,
            currentTime: now.format('HH:mm'),
            timezone: 'Asia/Tehran'
          });
        }
      }

      validPackages.push(userPackage);
    }

    if (validPackages.length === 0) {
      return res.status(403).json({
        message: 'این بسته در این ساعت فعال نیست',
        reason: 'No active packages available in current time window'
      });
    }

    let remainingToDeduct = user.consumptionOtpCount;
    const consumedPackages = [];
    const mongoose = require('mongoose');
    const redeemLogId = new mongoose.Types.ObjectId(); // Generate unique ID for this redemption

    // Deduct from packages (use validPackages instead of userPackages)
    for (const userPackage of validPackages) {
      if (remainingToDeduct <= 0) break;

      const deductCount = Math.min(remainingToDeduct, userPackage.remainingCount);
      userPackage.remainingCount -= deductCount;
      userPackage.history.push({
        restaurant: user.consumptionOtpRestaurant,
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

    const now = moment.tz('Asia/Tehran');
    let nextAvailableWindow = null;
    let windowStatus = 'available';

    // Check date range
    if (userPackage.startDate && now.isBefore(moment(userPackage.startDate).tz('Asia/Tehran'))) {
      windowStatus = 'not_started';
      nextAvailableWindow = moment(userPackage.startDate).tz('Asia/Tehran').toISOString();
    } else if (userPackage.endDate && now.isAfter(moment(userPackage.endDate).tz('Asia/Tehran'))) {
      windowStatus = 'expired';
    } else if (userPackage.timeWindows && userPackage.timeWindows.length > 0) {
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

        if (inWindow) {
          windowStatus = 'available';
          // Find when this window ends
          const today = now.clone().startOf('day');
          const windowEndTime = today.clone()
            .add(windowEnd.split(':')[0], 'hours')
            .add(windowEnd.split(':')[1], 'minutes');

          if (now.isBefore(windowEndTime)) {
            nextAvailableWindow = windowEndTime.toISOString();
          } else {
            // Window ends today, find next window
            for (const nextWindow of userPackage.timeWindows) {
              const nextStart = nextWindow.start;
              const nextStartTime = today.clone()
                .add(nextStart.split(':')[0], 'hours')
                .add(nextStart.split(':')[1], 'minutes');

              if (now.isBefore(nextStartTime)) {
                nextAvailableWindow = nextStartTime.toISOString();
                windowStatus = 'waiting';
                break;
              }
            }

            // If no window today, use first window tomorrow
            if (!nextAvailableWindow && userPackage.timeWindows.length > 0) {
              const firstWindow = userPackage.timeWindows[0];
              nextAvailableWindow = now.clone().add(1, 'day').startOf('day')
                .add(firstWindow.start.split(':')[0], 'hours')
                .add(firstWindow.start.split(':')[1], 'minutes')
                .toISOString();
              windowStatus = 'waiting';
            }
          }
          break;
        }
      }

      if (!inWindow) {
        windowStatus = 'waiting';
        // Find next available window
        for (const window of userPackage.timeWindows) {
          const windowStart = window.start;
          const today = now.clone().startOf('day');
          const windowStartTime = today.clone()
            .add(windowStart.split(':')[0], 'hours')
            .add(windowStart.split(':')[1], 'minutes');

          if (now.isBefore(windowStartTime)) {
            nextAvailableWindow = windowStartTime.toISOString();
            break;
          }
        }

        if (!nextAvailableWindow && userPackage.timeWindows.length > 0) {
          const firstWindow = userPackage.timeWindows[0];
          nextAvailableWindow = now.clone().add(1, 'day').startOf('day')
            .add(firstWindow.start.split(':')[0], 'hours')
            .add(firstWindow.start.split(':')[1], 'minutes')
            .toISOString();
        }
      }
    }

    const summary = {
      remainingTokens: userPackage.remainingCount,
      totalTokens: userPackage.totalCount,
      windowStatus,
      nextAvailableWindow,
      currentTime: now.format('YYYY-MM-DD HH:mm:ss'),
      timezone: 'Asia/Tehran',
      timeWindows: userPackage.timeWindows || [],
      startDate: userPackage.startDate || null,
      endDate: userPackage.endDate || null
    };

    res.json(summary);
  } catch (error) {
    console.error('Get remaining time error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
