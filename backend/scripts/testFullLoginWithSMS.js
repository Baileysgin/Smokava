require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');

const API_URL = process.env.API_URL || 'https://api.smokava.com/api';
const TEST_PHONE = '09302593819';

async function testFullLoginFlow() {
  console.log('\n🧪 Testing Full Login Flow with SMS');
  console.log('='.repeat(60));
  console.log(`📱 Phone Number: ${TEST_PHONE}`);
  console.log(`🌐 API URL: ${API_URL}`);
  console.log('='.repeat(60));

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smokava';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Send OTP
    console.log('📱 Step 1: Requesting OTP...');
    const sendResponse = await axios.post(`${API_URL}/auth/send-otp`, {
      phoneNumber: TEST_PHONE
    });
    console.log('✅ Response:', sendResponse.data.message);
    if (sendResponse.data.smsError) {
      console.log('⚠️  SMS Error:', sendResponse.data.smsError);
    }

    // Wait for SMS to be sent
    console.log('\n⏳ Waiting 5 seconds for SMS to be sent...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 2: Get OTP from database directly
    console.log('\n🔍 Step 2: Retrieving OTP code from database...');
    const user = await User.findOne({ phoneNumber: TEST_PHONE });
    if (!user || !user.otpCode) {
      console.error('❌ No OTP found in database!');
      process.exit(1);
    }

    const otpCode = user.otpCode;
    const expiresAt = user.otpExpiresAt;
    const now = new Date();

    console.log('✅ OTP Code retrieved:', otpCode);
    console.log('   Expires at:', expiresAt);
    console.log('   Current time:', now);
    console.log('   Is expired:', now > expiresAt ? 'YES ❌' : 'NO ✅');

    if (now > expiresAt) {
      console.error('❌ OTP has expired!');
      process.exit(1);
    }

    // Step 3: Verify OTP
    console.log('\n🔐 Step 3: Verifying OTP...');
    console.log('Using OTP code:', otpCode);

    const verifyResponse = await axios.post(`${API_URL}/auth/verify-otp`, {
      phoneNumber: TEST_PHONE,
      code: otpCode
    });

    console.log('✅ OTP Verified Successfully!');
    console.log('   Token:', verifyResponse.data.token ? `${verifyResponse.data.token.substring(0, 30)}...` : 'Missing');
    console.log('   User ID:', verifyResponse.data.user?._id || 'Missing');
    console.log('   Phone:', verifyResponse.data.user?.phoneNumber || 'Missing');

    // Step 4: Test authenticated endpoint
    if (verifyResponse.data.token) {
      console.log('\n🔑 Step 4: Testing authenticated endpoint...');
      const meResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${verifyResponse.data.token}`
        }
      });
      console.log('✅ User Profile Retrieved:');
      console.log('   Phone:', meResponse.data.phoneNumber);
      console.log('   ID:', meResponse.data._id);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ FULL LOGIN FLOW TEST: SUCCESS!');
    console.log('='.repeat(60));
    console.log('\n📱 IMPORTANT: Check your phone (09302593819) for the SMS!');
    console.log('   The OTP code should be:', otpCode);
    console.log('   You can use this code to login on the frontend.');
    console.log('');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
      if (error.stack) console.error('Stack:', error.stack);
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

testFullLoginFlow();



