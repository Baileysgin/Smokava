const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendOTP, generateLoginOTP } = require('../services/kavenegar');

// Send OTP to phone number
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Validate phone number format (should start with 09 for Iran)
    if (!/^09\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Generate 6-digit OTP for login
    const otpCode = generateLoginOTP();

    // OTP expires in 5 minutes
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      // Create user without username to avoid duplicate key error
      // Username will be set later when user completes profile
      user = new User({
        phoneNumber,
        username: undefined // Don't set empty string, use undefined
      });
    }

    // Save OTP code and expiration
    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Send OTP via Kavenegar
    await sendOTP(phoneNumber, otpCode);

    res.json({
      message: 'OTP sent successfully',
      expiresIn: 300 // 5 minutes in seconds
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

// Development endpoint to get OTP (only in development mode)
router.get('/get-otp', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Not available in production' });
    }

    const { phoneNumber } = req.query;
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user || !user.otpCode) {
      return res.status(404).json({ message: 'No OTP found for this phone number' });
    }

    // Check if OTP is expired
    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    res.json({
      otpCode: user.otpCode,
      expiresAt: user.otpExpiresAt
    });
  } catch (error) {
    console.error('Get OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP and login/register
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otpCode } = req.body;

    if (!phoneNumber || !otpCode) {
      return res.status(400).json({ message: 'Phone number and OTP code are required' });
    }

    // Development bypass: Allow test code 111111 for any phone number
    const isTestCode = otpCode === '111111';

    if (isTestCode && process.env.NODE_ENV !== 'production') {
      console.log('🔓 Test OTP code 111111 used for:', phoneNumber);

      // Find or create user
      let user = await User.findOne({ phoneNumber });
      if (!user) {
        user = new User({ phoneNumber });
        await user.save();
      }

      // Generate auth token
      const token = user.generateAuthToken();
      return res.json({ token, user });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please request OTP first' });
    }

    // Check if OTP exists and is not expired
    if (!user.otpCode || !user.otpExpiresAt) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one' });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one' });
    }

    // Verify OTP code
    if (user.otpCode !== otpCode) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    // Clear OTP after successful verification
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    // Generate auth token
    const token = user.generateAuthToken();
    res.json({ token, user });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login/Register with Telegram WebApp
router.post('/telegram-login', async (req, res) => {
  try {
    const { phoneNumber, telegramId, firstName, lastName, username, photoUrl } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Find user by phone number or telegramId
    let user = await User.findOne({
      $or: [
        { phoneNumber },
        ...(telegramId ? [{ telegramId }] : [])
      ]
    });

    if (!user) {
      // Create new user
      user = new User({
        phoneNumber,
        telegramId: telegramId || null,
        firstName: firstName || '',
        lastName: lastName || '',
        username: username || '',
        photoUrl: photoUrl || '',
        // Set legacy fields for backward compatibility
        name: firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || '',
        avatar: photoUrl || ''
      });
    } else {
      // Update existing user with Telegram profile data
      if (telegramId) user.telegramId = telegramId;
      if (firstName !== undefined) user.firstName = firstName || '';
      if (lastName !== undefined) user.lastName = lastName || '';
      if (username !== undefined) user.username = username || '';
      if (photoUrl !== undefined) user.photoUrl = photoUrl || '';
      // Update legacy fields
      user.name = (user.firstName && user.lastName)
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.firstName || user.lastName || '';
      user.avatar = user.photoUrl || '';
    }

    await user.save();
    const token = user.generateAuthToken();
    res.json({ token, user });
  } catch (error) {
    console.error('Telegram login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login/Register with phone number (deprecated - use Telegram login instead)
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    let user = await User.findOne({ phoneNumber });

    if (!user) {
      user = new User({ phoneNumber });
      await user.save();
    }

    const token = user.generateAuthToken();
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
