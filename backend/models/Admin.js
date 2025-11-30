const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent deletion of admin users
adminSchema.pre('remove', async function(next) {
  console.warn('⚠️  Attempt to delete admin user prevented:', this.username);
  throw new Error('Admin users cannot be deleted');
});

adminSchema.pre('deleteOne', async function(next) {
  const admin = await this.model.findOne(this.getQuery());
  if (admin) {
    console.warn('⚠️  Attempt to delete admin user prevented:', admin.username);
    throw new Error('Admin users cannot be deleted');
  }
  next();
});

adminSchema.pre('findOneAndDelete', async function(next) {
  const admin = await this.model.findOne(this.getQuery());
  if (admin) {
    console.warn('⚠️  Attempt to delete admin user prevented:', admin.username);
    throw new Error('Admin users cannot be deleted');
  }
  next();
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate auth token
adminSchema.methods.generateAuthToken = function() {
  return jwt.sign({ adminId: this._id, role: 'admin' }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d'
  });
};

module.exports = mongoose.model('Admin', adminSchema);
