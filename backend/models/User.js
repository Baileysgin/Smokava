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

userSchema.methods.generateAuthToken = function() {
  const payload = { userId: this._id };
  if (this.role) {
    payload.role = this.role;
  }
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d'
  });
};

module.exports = mongoose.model('User', userSchema);
