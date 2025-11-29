require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const checkOtp = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smokava');
    console.log('✅ MongoDB connected');

    const phoneNumber = process.argv[2] || '09302593819';
    const enteredCode = process.argv[3];

    console.log(`\n📱 Checking OTP for: ${phoneNumber}`);

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('\n📋 Current OTP Status:');
    console.log(`  OTP Code: ${user.otpCode || 'None'}`);
    console.log(`  OTP Expires: ${user.otpExpiresAt ? new Date(user.otpExpiresAt).toISOString() : 'None'}`);

    const now = new Date();
    const isExpired = user.otpExpiresAt ? now > new Date(user.otpExpiresAt) : true;
    console.log(`  Is Expired: ${isExpired}`);
    console.log(`  Time Remaining: ${user.otpExpiresAt ? Math.floor((new Date(user.otpExpiresAt) - now) / 1000) : 0} seconds`);

    if (enteredCode) {
      const normalizeCode = (code) => String(code || '').replace(/\D/g, '').trim();
      const provided = normalizeCode(enteredCode);
      const expected = normalizeCode(user.otpCode);

      console.log(`\n🔍 Code Comparison:`);
      console.log(`  Entered: ${enteredCode} (normalized: ${provided})`);
      console.log(`  Expected: ${user.otpCode} (normalized: ${expected})`);
      console.log(`  Match: ${provided === expected}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkOtp();
