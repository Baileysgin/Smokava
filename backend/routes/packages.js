const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const UserPackage = require('../models/UserPackage');
const auth = require('../middleware/auth');

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
    const package = await Package.findById(packageId);

    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Create pending user package (will be activated after payment)
    const userPackage = new UserPackage({
      user: req.user._id,
      package: packageId,
      totalCount: package.count,
      remainingCount: 0, // Will be set after payment
      status: 'pending' // Add status field
    });

    await userPackage.save();

    // Return payment gateway URL (IPG)
    // In production, generate actual IPG payment URL with userPackage._id as orderId
    const paymentUrl = `${process.env.IPG_BASE_URL || 'https://payment.example.com'}/payment?` +
      `orderId=${userPackage._id}&` +
      `amount=${package.price}&` +
      `callback=${encodeURIComponent(process.env.IPG_CALLBACK_URL || 'http://localhost:3000/packages/payment-callback')}`;

    res.json({
      paymentUrl,
      userPackageId: userPackage._id,
      amount: package.price
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
      remainingCount: { $gt: 0 }
    }).sort({ purchasedAt: 1 }); // Use oldest packages first

    let remainingToDeduct = user.consumptionOtpCount;
    const consumedPackages = [];

    // Deduct from packages
    for (const userPackage of userPackages) {
      if (remainingToDeduct <= 0) break;

      const deductCount = Math.min(remainingToDeduct, userPackage.remainingCount);
      userPackage.remainingCount -= deductCount;
      userPackage.history.push({
        restaurant: user.consumptionOtpRestaurant,
        count: deductCount,
        flavor: '',
        consumedAt: new Date()
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

    res.json({
      message: 'Shisha consumed successfully',
      restaurant: {
        name: restaurant.nameFa,
        _id: restaurant._id
      },
      count: user.consumptionOtpCount,
      consumedPackages
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

module.exports = router;
