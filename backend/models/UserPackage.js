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
    required: true
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
    }
  }]
});

module.exports = mongoose.model('UserPackage', userPackageSchema);
