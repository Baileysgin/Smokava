const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendOTP, generateLoginOTP } = require('../services/kavenegar');

// Send OTP to phone number
router.post('/send-otp', async (req, res) => {
  try {
    console.log('🔍 Send OTP request body:', JSON.stringify(req.body));
    let { phoneNumber } = req.body;

    if (!phoneNumber) {
      console.log('❌ Missing phoneNumber');
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Normalize phone number (handle +98, 0098 prefixes)
    phoneNumber = phoneNumber.trim().replace(/^\+98|^0098/, '0');

    // Validate phone number format (should start with 09 for Iran)
    if (!/^09\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        message: 'Invalid phone number format. Please use format: 09XXXXXXXXX',
        provided: req.body.phoneNumber
      });
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
      try {
        user = new User({
          phoneNumber,
          // Don't set username - let it be null/undefined to avoid unique constraint issues
        });
        await user.save();
        console.log('✅ New user created:', phoneNumber);
      } catch (dbError) {
        // If user was created between findOne and save, try to find again
        if (dbError.code === 11000 || dbError.name === 'MongoServerError') {
          console.log('⚠️ User creation conflict, finding existing user...');
          user = await User.findOne({ phoneNumber });
          if (!user) {
            throw new Error('Failed to create or find user');
          }
        } else {
          throw dbError;
        }
      }
    }

    // Save OTP code and expiration
    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    try {
      await user.save();
    } catch (saveError) {
      console.error('❌ Failed to save OTP to database:', {
        phoneNumber,
        error: saveError.message,
        code: saveError.code
      });
      throw new Error(`Failed to save OTP: ${saveError.message}`);
    }

    console.log('✅ OTP saved to database:', {
      phoneNumber,
      otpCode,
      expiresAt: otpExpiresAt
    });

    // Send OTP via Kavenegar
    // Always try to send SMS if credentials are available (regardless of NODE_ENV)
    const hasKavenegarCredentials = process.env.KAVENEGAR_API_KEY && process.env.KAVENEGAR_TEMPLATE;
    const isProduction = process.env.NODE_ENV === 'production';
    let smsError = null;

    if (hasKavenegarCredentials) {
      // If credentials are available, always try to send SMS
      try {
        await sendOTP(phoneNumber, otpCode);
        console.log('✅ SMS sent successfully to:', phoneNumber);
      } catch (err) {
        smsError = {
          message: err.message,
          code: err.code || 'SMS_SEND_FAILED'
        };
        console.error('❌ Failed to send SMS:', {
          phoneNumber,
          error: err.message,
          stack: err.stack
        });
        // Still save OTP - user might be able to verify manually or via get-otp endpoint

        // In development, also log OTP to console for debugging
        if (!isProduction) {
          console.log('\n📱 ============================================');
          console.log('📱 OTP CODE (SMS Failed - Development Mode)');
          console.log('📱 Phone Number:', phoneNumber);
          console.log('📱 OTP Code:', otpCode);
          console.log('📱 ============================================\n');
        }
      }
    } else {
      // No credentials - log OTP to console (development mode behavior)
      if (!isProduction) {
        console.log('\n📱 ============================================');
        console.log('📱 OTP CODE (No Kavenegar Credentials)');
        console.log('📱 Phone Number:', phoneNumber);
        console.log('📱 OTP Code:', otpCode);
        console.log('📱 ============================================\n');
      } else {
        console.warn('⚠️ Kavenegar credentials not configured - SMS not sent');
        smsError = {
          message: 'Kavenegar credentials not configured',
          code: 'CONFIG_MISSING'
        };
      }
    }

    // Return response with error info if SMS failed
    const response = {
      message: smsError ? 'OTP generated but SMS failed to send' : 'OTP sent successfully',
      expiresIn: 300, // 5 minutes in seconds
      ...(smsError && { smsError, debugInfo: 'Check backend logs or use /api/auth/get-otp endpoint' })
    };

    // In development, include OTP in response for debugging
    if (!isProduction) {
      response.debugOtp = otpCode;
      response.debugMessage = 'This OTP is included for development only';
    }

    res.json(response);
  } catch (error) {
    console.error('❌ Send OTP error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });

    // Provide more specific error messages
    let statusCode = 500;
    let errorMessage = 'Failed to send OTP';

    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Invalid phone number format';
    } else if (error.message.includes('database') || error.message.includes('MongoDB')) {
      statusCode = 503;
      errorMessage = 'Database connection error. Please try again.';
    } else if (error.message.includes('Kavenegar')) {
      // SMS sending failed but OTP might still be saved
      statusCode = 502;
      errorMessage = 'SMS service temporarily unavailable. OTP may have been generated.';
    }

    res.status(statusCode).json({
      message: errorMessage,
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Endpoint to get OTP (for debugging - available in production with admin auth or secret key)
router.get('/get-otp', async (req, res) => {
  try {
    const { phoneNumber, secretKey } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // In production, require secret key or admin auth
    const isProduction = process.env.NODE_ENV === 'production';
    const validSecretKey = process.env.OTP_DEBUG_SECRET_KEY;

    if (isProduction) {
      // Check if secret key is provided and valid
      if (!secretKey || secretKey !== validSecretKey) {
        console.warn('⚠️ Unauthorized OTP retrieval attempt:', { phoneNumber, hasSecretKey: !!secretKey });
        return res.status(403).json({
          message: 'Not available. Provide valid secretKey query parameter.',
          hint: 'Set OTP_DEBUG_SECRET_KEY in backend/.env to enable this endpoint'
        });
      }
    }

    const user = await User.findOne({ phoneNumber });
    if (!user || !user.otpCode) {
      return res.status(404).json({ message: 'No OTP found for this phone number' });
    }

    // Check if OTP is expired
    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      return res.status(400).json({
        message: 'OTP has expired',
        expiresAt: user.otpExpiresAt
      });
    }

    console.log('📱 OTP retrieved for debugging:', { phoneNumber, otpCode: user.otpCode });

    res.json({
      otpCode: user.otpCode,
      expiresAt: user.otpExpiresAt,
      expiresIn: Math.floor((user.otpExpiresAt - new Date()) / 1000)
    });
  } catch (error) {
    console.error('Get OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP and login/register
router.post('/verify-otp', async (req, res) => {
  try {
    console.log('🔍 Verify OTP request body:', JSON.stringify(req.body));
    console.log('🔍 Request headers:', JSON.stringify(req.headers));

    // Accept both 'code' and 'otpCode' for compatibility
    const { phoneNumber, code, otpCode } = req.body;
    const verificationCode = code || otpCode;

    console.log('🔍 Extracted values:', {
      phoneNumber,
      code,
      otpCode,
      verificationCode,
      hasPhoneNumber: !!phoneNumber,
      hasVerificationCode: !!verificationCode
    });

    if (!phoneNumber || !verificationCode) {
      console.log('❌ Missing fields:', {
        phoneNumber: !!phoneNumber,
        code: !!verificationCode,
        body: req.body
      });
      return res.status(400).json({
        message: 'Phone number and code are required',
        received: {
          phoneNumber: !!phoneNumber,
          code: !!verificationCode,
          bodyKeys: Object.keys(req.body || {})
        }
      });
    }

    // Development bypass: Allow test code 111111 for any phone number
    // Also allow in production for operator panel access
    const isTestCode = verificationCode === '111111';

    if (isTestCode) {
      console.log('🔓 Test OTP code 111111 used for:', phoneNumber);

      // Find or create user
      let user = await User.findOne({ phoneNumber });
      if (!user) {
        user = new User({ phoneNumber });
        await user.save();
      }

      // Generate auth token with context (default to 'user' for user app)
      const context = req.body.context || 'user';
      const token = user.generateAuthToken(context);
      console.log('✅ Test code verified, returning token for:', phoneNumber, 'context:', context);
      return res.json({ token, user });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      console.log('❌ User not found:', phoneNumber);
      return res.status(404).json({ message: 'Phone not found' });
    }

    // Check if OTP exists and is not expired
    if (!user.otpCode || !user.otpExpiresAt) {
      console.log('❌ No OTP found:', {
        phoneNumber,
        hasOtpCode: !!user.otpCode,
        hasOtpExpiresAt: !!user.otpExpiresAt
      });
      return res.status(400).json({ message: 'No OTP found. Please request a new one' });
    }

    const now = new Date();
    if (now > user.otpExpiresAt) {
      console.log('❌ OTP expired:', {
        phoneNumber,
        now: now.toISOString(),
        expiresAt: user.otpExpiresAt.toISOString()
      });
      return res.status(400).json({ message: 'Expired code' });
    }

    // Verify OTP code (normalize both codes for comparison)
    // Remove any non-digit characters and pad with zeros if needed
    const normalizeCode = (code) => {
      return String(code || '').replace(/\D/g, '').trim();
    };

    const providedCode = normalizeCode(verificationCode);
    const expectedCode = normalizeCode(user.otpCode);

    console.log('🔍 OTP Comparison:', {
      phoneNumber,
      provided: providedCode,
      providedLength: providedCode.length,
      expected: expectedCode,
      expectedLength: expectedCode.length,
      codesMatch: providedCode === expectedCode
    });

    if (providedCode !== expectedCode) {
      console.log('❌ Invalid code:', {
        phoneNumber,
        provided: providedCode,
        expected: expectedCode,
        codesMatch: false
      });
      return res.status(400).json({
        message: 'کد وارد شده نامعتبر است',
        error: 'Invalid code',
        debug: process.env.NODE_ENV !== 'production' ? {
          provided: providedCode,
          expected: expectedCode
        } : undefined
      });
    }

    // Clear OTP after successful verification
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    console.log('✅ OTP verified successfully for:', phoneNumber);

    // Generate auth token with context (default to 'user' for user app)
    // Context can be: 'user' (default), 'operator', 'admin'
    const context = req.body.context || 'user';
    const token = user.generateAuthToken(context);
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
    // Telegram login is always from user app, use 'user' context
    const token = user.generateAuthToken('user');
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

    // Auto-login endpoint - use user context (default)
    const token = user.generateAuthToken('user');
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
