const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const axios = require('axios');

const API_URL = process.env.API_URL || 'https://api.smokava.com/api';
const TEST_PHONE = '09302593819';

async function testFullLoginFlow() {
  console.log('\n🧪 Testing Full Login Flow\n');
  console.log('='.repeat(50));

  try {
    // Step 1: Send OTP
    console.log('\n📱 Step 1: Sending OTP...');

    const sendResponse = await axios.post(`${API_URL}/auth/send-otp`, {
      phoneNumber: TEST_PHONE
    });
    console.log('✅ OTP Request Response:', sendResponse.data);

    // Wait a moment for SMS to be sent
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Get OTP from backend (for testing)
    console.log('\n🔍 Step 2: Retrieving OTP for verification...');
    const getOtpResponse = await axios.get(`${API_URL}/auth/get-otp`, {
      params: {
        phoneNumber: TEST_PHONE,
        secretKey: process.env.OTP_DEBUG_SECRET_KEY || 'smokava-otp-debug-2024'
      }
    });
    const otpCode = getOtpResponse.data.otpCode;
    console.log('✅ Retrieved OTP Code:', otpCode);

    // Step 3: Verify OTP
    console.log('\n🔐 Step 3: Verifying OTP...');
    console.log('Using OTP code:', otpCode);

    const verifyResponse = await axios.post(`${API_URL}/auth/verify-otp`, {
      phoneNumber: TEST_PHONE,
      code: otpCode
    });

    console.log('✅ OTP Verification Response:');
    console.log('  Token:', verifyResponse.data.token ? `${verifyResponse.data.token.substring(0, 20)}...` : 'Missing');
    console.log('  User ID:', verifyResponse.data.user?._id || 'Missing');
    console.log('  Phone:', verifyResponse.data.user?.phoneNumber || 'Missing');

    // Step 4: Test authenticated endpoint
    if (verifyResponse.data.token) {
      console.log('\n🔑 Step 4: Testing authenticated endpoint...');
      const meResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${verifyResponse.data.token}`
        }
      });
      console.log('✅ User Profile:', {
        phone: meResponse.data.phoneNumber,
        id: meResponse.data._id
      });
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ FULL LOGIN FLOW TEST: SUCCESS!');
    console.log('='.repeat(50));
    console.log('\n📱 Check your phone (09302593819) for the SMS!');
    console.log('   OTP Code sent:', otpCode);
    console.log('');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testFullLoginFlow();
