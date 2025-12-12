const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // Telegram profile fields
  telegramId: {
    type: Number,
    unique: true,
    sparse: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  username: {
    type: String,
    default: null,
    unique: true,
    sparse: true
  },
  photoUrl: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 200
  },
  // Legacy fields (kept for backward compatibility)
  name: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  // OTP for authentication
  otpCode: {
    type: String,
    default: null
  },
  otpExpiresAt: {
    type: Date,
    default: null
  },
  // OTP for shisha consumption
  consumptionOtp: {
    type: String,
    default: null
  },
  consumptionOtpExpiresAt: {
    type: Date,
    default: null
  },
  consumptionOtpRestaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null
  },
  consumptionOtpCount: {
    type: Number,
    default: 0
  },
  consumptionOtpUsed: {
    type: Boolean,
    default: false
  },
  // Following users (Telegram contacts)
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Privacy settings
  isPrivate: {
    type: Boolean,
    default: false
  },
  // User role: 'user', 'restaurant_operator', 'admin'
  role: {
    type: String,
    enum: ['user', 'restaurant_operator', 'admin'],
    default: 'user'
  },
  // Restaurant assignment for operators
  assignedRestaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.methods.generateAuthToken = function(context = 'user') {
  const payload = { userId: this._id };

  // Context-aware role assignment
  // - 'user': Always use 'user' role (default for user app)
  // - 'admin': Check if user has admin role (for admin panel)
  // - 'operator': Check if user has restaurant_operator role (for operator panel)

  if (context === 'user') {
    payload.role = 'user'; // Always user role for user app
  } else if (context === 'admin') {
    // Check UserRole model for admin role, fallback to user.role
    payload.role = this.role === 'admin' ? 'admin' : null;
  } else if (context === 'operator') {
    // Check if user has restaurant_operator role
    payload.role = this.role === 'restaurant_operator' ? 'restaurant_operator' : null;
  } else {
    // Fallback to user's default role
    payload.role = this.role || 'user';
  }

  payload.context = context; // Include context for debugging

  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d'
  });
};

module.exports = mongoose.model('User', userSchema);
