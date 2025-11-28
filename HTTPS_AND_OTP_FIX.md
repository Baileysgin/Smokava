# HTTPS and OTP Fix Summary

## Changes Made

### 1. Frontend API Client (`frontend/lib/api.ts`)
- ✅ Added HTTPS validation in production mode
- ✅ Throws error if `NEXT_PUBLIC_API_URL` uses HTTP in production
- ✅ Development mode still allows `http://localhost:5000/api` for local development

### 2. Admin Panel API Client (`admin-panel/src/lib/api.ts`)
- ✅ Added HTTPS validation in production mode
- ✅ Throws error if `VITE_API_URL` uses HTTP in production
- ✅ Development mode still allows `http://localhost:5000/api` for local development

### 3. OTP/SMS Service (`backend/services/kavenegar.js`)
- ✅ Added comprehensive logging for OTP sending
- ✅ Better error messages with detailed information
- ✅ Logs API key and template configuration status
- ✅ Logs Kavenegar API responses and errors
- ✅ Improved error handling for timeout and API errors

### 4. Auth Route (`backend/routes/auth.js`)
- ✅ In production, now waits for SMS to be sent before responding
- ✅ Better error logging for SMS failures
- ✅ OTP is still saved even if SMS fails (user can verify manually)
- ✅ Detailed logging for debugging OTP issues

## Environment Variables Required

### For HTTPS to Work:
Make sure these environment variables are set to HTTPS URLs in production:

**Frontend** (`frontend/.env.local` or production environment):
```bash
NEXT_PUBLIC_API_URL=https://api.smokava.com/api
```

**Admin Panel** (`admin-panel/.env` or production environment):
```bash
VITE_API_URL=https://api.smokava.com/api
```

### For OTP/SMS to Work:
Make sure these environment variables are set in `backend/.env`:

```bash
KAVENEGAR_API_KEY=your-actual-api-key-here
KAVENEGAR_TEMPLATE=your-template-name-here
NODE_ENV=production
```

## Troubleshooting OTP Issues

If SMS is not being sent, check the backend logs for:

1. **Configuration Check:**
   ```
   📱 Sending OTP: {
     phoneNumber: '...',
     hasApiKey: true/false,
     hasTemplate: true/false,
     template: '...',
     isDevelopment: false
   }
   ```

2. **API Call:**
   ```
   📱 Calling Kavenegar API: {
     url: 'https://api.kavenegar.com/v1/***/verify/lookup.json',
     phoneNumber: '...',
     template: '...'
   }
   ```

3. **Success Response:**
   ```
   ✅ Kavenegar API Response: {
     status: 200,
     returnStatus: 200,
     message: 'OK'
   }
   ✅ SMS sent successfully to: ...
   ```

4. **Error Response:**
   ```
   ❌ OTP Send Error: {
     code: '...',
     message: '...',
     response: {...}
   }
   ```

## Common OTP Issues

### Issue 1: Missing Environment Variables
**Symptom:** Error: "Kavenegar configuration missing: KAVENEGAR_API_KEY" or "KAVENEGAR_TEMPLATE"

**Solution:**
- Check that `KAVENEGAR_API_KEY` and `KAVENEGAR_TEMPLATE` are set in `backend/.env`
- Restart the backend server after setting environment variables

### Issue 2: Invalid API Key
**Symptom:** Error: "Kavenegar API error: Invalid API key"

**Solution:**
- Verify your Kavenegar API key is correct
- Check that the API key is active in your Kavenegar dashboard

### Issue 3: Invalid Template
**Symptom:** Error: "Kavenegar API error: Template not found"

**Solution:**
- Verify the template name matches exactly what's in your Kavenegar dashboard
- Check that the template is approved and active
- Ensure the template uses `{token}` placeholder for the OTP code

### Issue 4: Phone Number Format
**Symptom:** Error: "Invalid phone number format"

**Solution:**
- Phone numbers must be in format: `09XXXXXXXXX` (11 digits starting with 09)
- Remove any spaces, dashes, or country codes

### Issue 5: API Timeout
**Symptom:** Error: "Kavenegar API timeout - please try again"

**Solution:**
- Check your server's internet connection
- Verify Kavenegar service is operational
- Try again after a few seconds

## Testing OTP

### Development Mode
In development mode (`NODE_ENV=development`), if `KAVENEGAR_API_KEY` or `KAVENEGAR_TEMPLATE` are not set, the OTP will be logged to the console instead of being sent via SMS.

### Production Mode
In production mode (`NODE_ENV=production`), SMS will be sent via Kavenegar. Check the backend logs to see if SMS was sent successfully.

### Test Code (Development Only)
You can use the test code `111111` to bypass OTP verification in development mode. This does NOT work in production.

## Next Steps

1. **Verify Environment Variables:**
   - Check that all HTTPS URLs are set correctly
   - Verify Kavenegar credentials are set in `backend/.env`

2. **Restart Services:**
   - Restart backend server to load new environment variables
   - Rebuild frontend/admin panel if needed

3. **Check Logs:**
   - Monitor backend logs when requesting OTP
   - Look for the detailed logging messages added in this fix

4. **Test OTP Flow:**
   - Try requesting an OTP with your phone number
   - Check backend logs for any errors
   - Verify SMS is received

## Files Modified

- `frontend/lib/api.ts` - Added HTTPS validation
- `admin-panel/src/lib/api.ts` - Added HTTPS validation
- `backend/services/kavenegar.js` - Improved error handling and logging
- `backend/routes/auth.js` - Better OTP sending and error handling
