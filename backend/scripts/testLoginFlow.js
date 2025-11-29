require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'https://api.smokava.com/api';
const TEST_PHONE = '09302593819';
const DEBUG_SECRET = process.env.OTP_DEBUG_SECRET_KEY || 'smokava-otp-debug-2024';

async function testFullLoginFlow() {
  console.log('\n🧪 Testing Full Login Flow');
  console.log('='.repeat(60));
  console.log(`📱 Phone Number: ${TEST_PHONE}`);
  console.log(`🌐 API URL: ${API_URL}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Send OTP
    console.log('\n📱 Step 1: Requesting OTP...');
    const sendResponse = await axios.post(`${API_URL}/auth/send-otp`, {
      phoneNumber: TEST_PHONE
    });
    console.log('✅ Response:', sendResponse.data.message);
    if (sendResponse.data.smsError) {
      console.log('⚠️  SMS Error:', sendResponse.data.smsError);
    }

    // Wait for SMS to be sent
    console.log('\n⏳ Waiting 3 seconds for SMS to be sent...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Get OTP from backend
    console.log('\n🔍 Step 2: Retrieving OTP code...');
    const getOtpResponse = await axios.get(`${API_URL}/auth/get-otp`, {
      params: {
        phoneNumber: TEST_PHONE,
        secretKey: DEBUG_SECRET
      }
    });
    const otpCode = getOtpResponse.data.otpCode;
    console.log('✅ OTP Code retrieved:', otpCode);
    console.log('   Expires in:', getOtpResponse.data.expiresIn, 'seconds');

    // Step 3: Verify OTP
    console.log('\n🔐 Step 3: Verifying OTP...');
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
    console.log('');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testFullLoginFlow();

