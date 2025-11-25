const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  nameFa: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  addressFa: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  phone: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  }
});

restaurantSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
