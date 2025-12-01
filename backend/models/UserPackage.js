const mongoose = require('mongoose');

const userPackageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: function() {
      return !this.isGift; // Package is required only if not a gift
    }
  },
  // Gift package fields
  isGift: {
    type: Boolean,
    default: false
  },
  giftFromRestaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  totalCount: {
    type: Number,
    required: true
  },
  remainingCount: {
    type: Number,
    required: true
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired'],
    default: 'active'
  },
  // Expiry date - calculated from purchasedAt + package.durationDays
  expiresAt: {
    type: Date,
    default: null // null means no expiry
  },
  history: [{
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant'
    },
    count: {
      type: Number,
      default: 1
    },
    flavor: {
      type: String,
      default: ''
    },
    consumedAt: {
      type: Date,
      default: Date.now
    },
    redeemLogId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  }]
});

module.exports = mongoose.model('UserPackage', userPackageSchema);
