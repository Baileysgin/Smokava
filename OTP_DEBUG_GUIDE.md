# OTP/SMS Debugging Guide

## Quick Debugging Steps

### 1. Check Backend Logs
When you request an OTP, check your backend server logs. You should see:

**If SMS is sent successfully:**
```
📱 Sending OTP: { phoneNumber: '09302593819', hasApiKey: true, hasTemplate: true, ... }
📱 Calling Kavenegar API: { url: 'https://api.kavenegar.com/v1/***/verify/lookup.json', ... }
✅ Kavenegar API Response: { status: 200, returnStatus: 200, message: 'OK' }
✅ SMS sent successfully to: 09302593819
```

**If SMS fails:**
```
❌ OTP Send Error: { code: '...', message: '...', response: {...} }
❌ Failed to send SMS: { phoneNumber: '...', error: '...', stack: '...' }
```

### 2. Check Environment Variables
Make sure these are set in `backend/.env`:

```bash
KAVENEGAR_API_KEY=your-actual-api-key-here
KAVENEGAR_TEMPLATE=your-template-name-here
NODE_ENV=production
```

**To verify they're loaded:**
```bash
# In your backend directory
node -e "require('dotenv').config(); console.log('API Key:', process.env.KAVENEGAR_API_KEY ? 'Set' : 'Missing'); console.log('Template:', process.env.KAVENEGAR_TEMPLATE || 'Missing');"
```

### 3. Retrieve OTP Manually (For Testing)

#### Option A: Development Mode
In development mode, the OTP is included in the API response:
```json
{
  "message": "OTP sent successfully",
  "expiresIn": 300,
  "debugOtp": "123456",
  "debugMessage": "This OTP is included for development only"
}
```

#### Option B: Get OTP Endpoint
You can retrieve the OTP using the `/api/auth/get-otp` endpoint:

**In Development:**
```bash
curl "http://localhost:5000/api/auth/get-otp?phoneNumber=09302593819"
```

**In Production:**
1. First, set a secret key in `backend/.env`:
```bash
OTP_DEBUG_SECRET_KEY=your-secret-key-here
```

2. Then call the endpoint with the secret:
```bash
curl "https://api.smokava.com/api/auth/get-otp?phoneNumber=09302593819&secretKey=your-secret-key-here"
```

Response:
```json
{
  "otpCode": "123456",
  "expiresAt": "2024-01-01T12:05:00.000Z",
  "expiresIn": 240
}
```

### 4. Common Issues and Solutions

#### Issue: "Kavenegar configuration missing"
**Symptom:** Error message says API key or template is missing

**Solution:**
- Check that `KAVENEGAR_API_KEY` and `KAVENEGAR_TEMPLATE` are set in `backend/.env`
- Restart the backend server after setting environment variables
- Verify the `.env` file is in the `backend/` directory

#### Issue: "Kavenegar API error: Invalid API key"
**Symptom:** API key is rejected by Kavenegar

**Solution:**
- Verify your API key is correct in Kavenegar dashboard
- Check that the API key is active (not suspended)
- Make sure there are no extra spaces or quotes in the `.env` file

#### Issue: "Kavenegar API error: Template not found"
**Symptom:** Template name is not recognized

**Solution:**
- Verify the template name matches exactly (case-sensitive)
- Check that the template is approved in Kavenegar dashboard
- Ensure the template uses `{token}` placeholder for OTP code
- Template must be of type "verify" (lookup template)

#### Issue: "Kavenegar API timeout"
**Symptom:** Request times out after 10 seconds

**Solution:**
- Check your server's internet connection
- Verify Kavenegar service is operational
- Try again after a few seconds
- Check if your server firewall is blocking outbound HTTPS requests

#### Issue: SMS sent but not received
**Symptom:** Backend logs show success but no SMS received

**Possible causes:**
1. **Phone number format:** Must be `09XXXXXXXXX` (11 digits, no country code)
2. **Kavenegar account limits:** Check your account balance/credits
3. **Carrier issues:** Some carriers may delay or block SMS
4. **Wrong phone number:** Double-check the number you entered

**Solution:**
- Verify phone number format is correct
- Check Kavenegar dashboard for delivery status
- Try with a different phone number
- Check Kavenegar account balance

### 5. Testing Without SMS

#### Development Mode
In development mode (`NODE_ENV=development`), if Kavenegar credentials are not set, the OTP will be logged to console instead of being sent:

```
📱 ============================================
📱 OTP CODE (Development Mode)
📱 Phone Number: 09302593819
📱 OTP Code: 123456
📱 ============================================
```

#### Test Code (Development Only)
You can use the test code `111111` to bypass OTP verification in development mode. This does NOT work in production.

### 6. Frontend Error Messages

The frontend now shows detailed error messages:

- **SMS Failed:** "⚠️ کد تایید تولید شد اما ارسال پیامک ناموفق بود: [error message]"
- **Invalid Phone:** "Invalid phone number format"
- **Server Error:** "خطایی در ارسال کد تایید رخ داد"

### 7. Verify Kavenegar Configuration

#### Check API Key Format
Your Kavenegar API key should look like: `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

#### Check Template Format
Your template should:
- Be a "verify" (lookup) template
- Contain `{token}` placeholder
- Be approved and active in Kavenegar dashboard

Example template content:
```
کد تایید شما: {token}
```

### 8. Monitoring and Logs

#### Enable Detailed Logging
The backend now logs:
- OTP generation
- Kavenegar API calls
- API responses
- Errors with full details

#### Check Logs in Real-Time
```bash
# If using PM2
pm2 logs backend

# If using Docker
docker-compose logs -f backend

# If running directly
# Logs will appear in the terminal where you started the server
```

### 9. Quick Test Checklist

- [ ] `KAVENEGAR_API_KEY` is set in `backend/.env`
- [ ] `KAVENEGAR_TEMPLATE` is set in `backend/.env`
- [ ] Backend server was restarted after setting env vars
- [ ] Phone number format is `09XXXXXXXXX` (11 digits)
- [ ] Kavenegar account has credits/balance
- [ ] Template is approved and active in Kavenegar
- [ ] Server has internet connection
- [ ] Check backend logs for error messages
- [ ] Try retrieving OTP via `/api/auth/get-otp` endpoint

### 10. Still Not Working?

1. **Check Kavenegar Dashboard:**
   - Log in to your Kavenegar account
   - Check "Reports" section for SMS delivery status
   - Verify your account has credits

2. **Test Kavenegar API Directly:**
```bash
curl "https://api.kavenegar.com/v1/YOUR_API_KEY/verify/lookup.json?receptor=09302593819&token=123456&template=YOUR_TEMPLATE"
```

3. **Contact Support:**
   - Check Kavenegar support documentation
   - Verify your account status
   - Check if there are any service outages

## Security Notes

- **Never commit `.env` files** to git
- **OTP_DEBUG_SECRET_KEY** should be a strong random string
- **Get OTP endpoint** should only be used for debugging, not in production user flows
- In production, consider restricting `/get-otp` endpoint to admin IPs only
