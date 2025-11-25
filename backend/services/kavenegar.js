const axios = require('axios');

/**
 * Send OTP SMS using Kavenegar lookup.json API
 * @param {string} phoneNumber - Phone number (e.g., 09123456789)
 * @param {string} token - 5-digit OTP code
 * @returns {Promise<Object>} - API response
 */
async function sendOTP(phoneNumber, token) {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const template = process.env.KAVENEGAR_TEMPLATE;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Development mode: log OTP to console instead of sending SMS
  if (isDevelopment && (!apiKey || !template)) {
    console.log('\n📱 ============================================');
    console.log('📱 OTP CODE (Development Mode)');
    console.log('📱 Phone Number:', phoneNumber);
    console.log('📱 OTP Code:', token);
    console.log('📱 ============================================\n');
    return { return: { status: 200, message: 'OK' } };
  }

  if (!apiKey || !template) {
    throw new Error('Kavenegar API key or template not configured');
  }

  try {
    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`;

    const response = await axios.get(url, {
      params: {
        receptor: phoneNumber,
        token: token,
        template: template
      }
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Kavenegar API error: ${error.response.data?.message || error.message}`);
    }
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
}

/**
 * Generate a 5-digit OTP code (for consumption/shisha redemption)
 * @returns {string} - 5-digit code (always 5 digits, padded with zeros if needed)
 */
function generateOTP() {
  const code = Math.floor(10000 + Math.random() * 90000);
  // Ensure it's always 5 digits by padding with zeros
  return code.toString().padStart(5, '0');
}

/**
 * Generate a 6-digit OTP code (for login/authentication)
 * @returns {string} - 6-digit code (always 6 digits, padded with zeros if needed)
 */
function generateLoginOTP() {
  const code = Math.floor(100000 + Math.random() * 900000);
  // Ensure it's always 6 digits by padding with zeros
  return code.toString().padStart(6, '0');
}

module.exports = {
  sendOTP,
  generateOTP,
  generateLoginOTP
};
