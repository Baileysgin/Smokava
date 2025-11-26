const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserPackage',
    default: null
  },
  isGift: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  redeemLogId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
ratingSchema.index({ restaurantId: 1, createdAt: -1 });
ratingSchema.index({ userId: 1, redeemLogId: 1 }, { unique: true }); // One rating per redemption

module.exports = mongoose.model('Rating', ratingSchema);


