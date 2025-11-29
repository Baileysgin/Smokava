require('dotenv').config();
const { sendOTP, generateLoginOTP } = require('../services/kavenegar');

async function testKavenegar() {
  console.log('\n🧪 Testing Kavenegar OTP Service\n');
  console.log('Configuration:');
  console.log('  API Key:', process.env.KAVENEGAR_API_KEY ? `${process.env.KAVENEGAR_API_KEY.substring(0, 10)}...` : '❌ NOT SET');
  console.log('  Template:', process.env.KAVENEGAR_TEMPLATE || '❌ NOT SET');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('');

  if (!process.env.KAVENEGAR_API_KEY || !process.env.KAVENEGAR_TEMPLATE) {
    console.error('❌ ERROR: Kavenegar credentials not configured!');
    console.error('   Please set KAVENEGAR_API_KEY and KAVENEGAR_TEMPLATE in backend/.env');
    process.exit(1);
  }

  // Test phone number - replace with your actual number for real test
  const testPhoneNumber = process.argv[2] || '09302593819';
  const testOTP = generateLoginOTP();

  console.log('📱 Test Details:');
  console.log('  Phone Number:', testPhoneNumber);
  console.log('  OTP Code:', testOTP);
  console.log('');

  try {
    console.log('🔄 Sending OTP via Kavenegar...\n');
    const result = await sendOTP(testPhoneNumber, testOTP);

    console.log('\n✅ SUCCESS! OTP sent successfully');
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log('\n📱 Check your phone for the SMS with code:', testOTP);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ FAILED to send OTP');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.log('');
    process.exit(1);
  }
}

testKavenegar();

