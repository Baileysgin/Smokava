const axios = require('axios');

/**
 * Send OTP SMS using Kavenegar verify/lookup.json API
 * Documentation: https://kavenegar.com/rest.html
 * Node.js SDK: https://kavenegar.com/SDK.html#node
 *
 * @param {string} phoneNumber - Phone number (e.g., 09123456789)
 * @param {string} token - OTP code (6-digit for login)
 * @returns {Promise<Object>} - API response
 */
async function sendOTP(phoneNumber, token) {
  // Get configuration from environment variables
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const template = process.env.KAVENEGAR_TEMPLATE;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  console.log('📱 Sending OTP via Kavenegar lookup.json:', {
    phoneNumber,
    hasApiKey: !!apiKey,
    hasTemplate: !!template,
    template,
    tokenLength: token?.length,
    isDevelopment
  });

  // Validate required environment variables
  if (!apiKey) {
    const errorMsg = 'KAVENEGAR_API_KEY environment variable is required';
    console.error('❌ OTP Send Failed:', errorMsg);
    throw new Error(errorMsg);
  }

  if (!template) {
    const errorMsg = 'KAVENEGAR_TEMPLATE environment variable is required';
    console.error('❌ OTP Send Failed:', errorMsg);
    throw new Error(errorMsg);
  }

  // Development mode: log OTP to console instead of sending SMS
  if (isDevelopment) {
    console.log('\n📱 ============================================');
    console.log('📱 OTP CODE (Development Mode)');
    console.log('📱 Phone Number:', phoneNumber);
    console.log('📱 OTP Code:', token);
    console.log('📱 Template:', template);
    console.log('📱 ============================================\n');
    return { return: { status: 200, message: 'OK' } };
  }

  try {
    // Kavenegar verify/lookup.json endpoint
    // Documentation: https://kavenegar.com/rest.html#verify-lookup
    // Endpoint: GET https://api.kavenegar.com/v1/{API_KEY}/verify/lookup.json
    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`;

    console.log('📱 Calling Kavenegar verify/lookup.json API:', {
      url: url.replace(apiKey, '***'),
      phoneNumber,
      template,
      token: token.substring(0, 2) + '****' // Show only first 2 digits for security
    });

    // Make GET request to Kavenegar API
    // Parameters:
    //   - receptor: Phone number to send SMS to
    //   - token: OTP code (token)
    //   - template: Template name
    const response = await axios.get(url, {
      params: {
        receptor: phoneNumber,  // Phone number to send SMS to
        token: token,           // OTP code (token)
        template: template      // Template name
      },
      timeout: 15000, // 15 second timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Smokava-OTP-Service/1.0'
      },
      validateStatus: function (status) {
        // Don't throw for 4xx errors, we'll handle them manually
        return status < 500;
      }
    });

    console.log('✅ Kavenegar API Response:', {
      status: response.status,
      returnStatus: response.data?.return?.status,
      message: response.data?.return?.message,
      entriesCount: response.data?.entries?.length || 0
    });

    // Check if Kavenegar returned an error
    if (response.data?.return?.status !== 200) {
      const errorMsg = response.data?.return?.message || 'Unknown Kavenegar error';
      const errorCode = response.data?.return?.status;

      // If lookup.json requires premium (error 426), fallback to basic SMS send
      if (errorCode === 426) {
        console.log('⚠️  lookup.json requires premium service (error 426), falling back to basic SMS send...');

        // Fallback to basic SMS send endpoint (works with all Kavenegar plans)
        const sendUrl = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;
        const message = `کد تایید اسموکاوا: ${token}\n\nاین کد تا 5 دقیقه معتبر است.`;

        console.log('📱 Using Kavenegar basic SMS send (fallback):', {
          url: sendUrl.replace(apiKey, '***'),
          phoneNumber
        });

        const fallbackResponse = await axios.get(sendUrl, {
          params: {
            receptor: phoneNumber,
            message: message
            // Note: sender parameter is optional, Kavenegar will use default
          },
          timeout: 15000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Smokava-OTP-Service/1.0'
          },
          validateStatus: function (status) {
            return status < 500;
          }
        });

        if (fallbackResponse.data?.return?.status !== 200) {
          const fallbackError = fallbackResponse.data?.return?.message || 'Unknown error';
          const fallbackCode = fallbackResponse.data?.return?.status;
          console.error('❌ Kavenegar Basic Send Error:', {
            status: fallbackCode,
            message: fallbackError
          });
          throw new Error(`Kavenegar API error (${fallbackCode}): ${fallbackError}`);
        }

        console.log('✅ SMS sent via basic send endpoint (fallback)');
        if (fallbackResponse.data?.entries && fallbackResponse.data.entries.length > 0) {
          const entry = fallbackResponse.data.entries[0];
          console.log('✅ SMS Details:', {
            messageId: entry.messageid,
            status: entry.status,
            statusText: entry.statustext,
            receptor: entry.receptor
          });
        }
        return fallbackResponse.data;
      }

      // For other errors, throw the original error
      console.error('❌ Kavenegar API Error:', {
        status: errorCode,
        message: errorMsg,
        fullResponse: response.data
      });
      throw new Error(`Kavenegar API error (${errorCode}): ${errorMsg}`);
    }

    // Log success details if available
    if (response.data?.entries && response.data.entries.length > 0) {
      const entry = response.data.entries[0];
      console.log('✅ SMS Details:', {
        messageId: entry.messageid,
        status: entry.status,
        statusText: entry.statustext,
        receptor: entry.receptor,
        sender: entry.sender,
        date: entry.date,
        cost: entry.cost
      });
    }

    return response.data;
  } catch (error) {
    console.error('❌ OTP Send Error:', {
      code: error.code,
      message: error.message,
      response: error.response?.data
    });

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      throw new Error('Kavenegar API timeout - please try again');
    }

    // Handle API response errors
    if (error.response) {
      const errorMsg = error.response.data?.return?.message ||
                       error.response.data?.message ||
                       error.message;
      throw new Error(`Kavenegar API error: ${errorMsg}`);
    }

    // Handle network errors
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
