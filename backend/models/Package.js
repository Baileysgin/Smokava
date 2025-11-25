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
  }
});

module.exports = mongoose.model('Package', packageSchema);
