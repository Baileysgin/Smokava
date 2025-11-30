const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  nameFa: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  badge: {
    type: String,
    enum: ['popular', 'special', null],
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  // New fields for package management
  quantity_display_fa: {
    type: String,
    default: ''
  },
  price_per_item_fa: {
    type: String,
    default: ''
  },
  feature_usage_fa: {
    type: String,
    default: ''
  },
  feature_validity_fa: {
    type: String,
    default: ''
  },
  feature_support_fa: {
    type: String,
    default: ''
  },
  package_icon: {
    type: String,
    default: ''
  },
  // Time-based activation fields
  timeWindows: [{
    start: {
      type: String, // Format: "HH:mm" (e.g., "13:00")
      required: true
    },
    end: {
      type: String, // Format: "HH:mm" (e.g., "17:00")
      required: true
    },
    timezone: {
      type: String,
      default: 'Asia/Tehran'
    }
  }],
  durationDays: {
    type: Number,
    default: null // null means no expiry
  }
});

module.exports = mongoose.model('Package', packageSchema);
