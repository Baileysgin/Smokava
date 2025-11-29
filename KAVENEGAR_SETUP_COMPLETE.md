# Kavenegar Setup Complete ✅

## Configuration Applied

### Credentials Configured:
- **API Key:** `4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D`
- **Template:** `otp-v2`
- **Environment:** Production

### Files Updated:
1. ✅ `backend/.env` - Kavenegar credentials added
2. ✅ `docker-compose.yml` - Environment variables configured
3. ✅ `backend/services/kavenegar.js` - Enhanced error handling
4. ✅ `backend/scripts/testKavenegar.js` - Test script created
5. ✅ `backend/package.json` - Added test command

## Testing

### Test Kavenegar Integration:
```bash
cd backend
npm run test:kavenegar [phone-number]
```

Example:
```bash
cd backend
npm run test:kavenegar 09302593819
```

### What the Test Does:
1. ✅ Verifies API key and template are configured
2. ✅ Generates a 6-digit OTP code
3. ✅ Sends OTP via Kavenegar API
4. ✅ Shows detailed response and error information

## Integration Status

### Backend Routes:
- ✅ `/api/auth/send-otp` - Sends OTP via Kavenegar
- ✅ `/api/auth/verify-otp` - Verifies OTP code
- ✅ `/api/auth/get-otp` - Retrieves OTP for debugging

### Features:
- ✅ Production mode sends real SMS via Kavenegar
- ✅ Development mode logs OTP to console if credentials missing
- ✅ Comprehensive error logging
- ✅ OTP retrieval endpoint for debugging
- ✅ Enhanced error messages

## Next Steps

### 1. Restart Backend Server
After configuration, restart your backend server:
```bash
# If using Docker
docker-compose restart backend

# If running directly
cd backend
npm start
```

### 2. Test OTP Flow
1. Go to your frontend: `https://smokava.com/auth`
2. Enter phone number: `09302593819`
3. Click "ارسال کد تایید" (Send verification code)
4. Check your phone for SMS
5. Enter the OTP code to login

### 3. Monitor Logs
Watch backend logs for OTP operations:
```bash
# Docker
docker-compose logs -f backend

# Direct
# Logs will appear in terminal
```

Look for:
- `✅ SMS sent successfully` - SMS was sent
- `❌ Failed to send SMS` - Check error details

### 4. If SMS Doesn't Arrive

#### Option A: Check Backend Logs
The OTP code is logged when generated:
```
✅ OTP saved to database: { phoneNumber: '...', otpCode: '...', ... }
```

#### Option B: Use Get OTP Endpoint
```bash
curl "https://api.smokava.com/api/auth/get-otp?phoneNumber=09302593819&secretKey=smokava-otp-debug-2024"
```

## Troubleshooting

### Network Connection Issues
If you see `ECONNRESET` or connection errors:
- This might be a local network/firewall issue
- The server where the app runs should have internet access
- Test from the production server, not local machine

### API Key Issues
- Verify API key is correct (no extra spaces)
- Check Kavenegar dashboard for account status
- Ensure API key is active

### Template Issues
- Template name must match exactly: `otp-v2`
- Template must be approved in Kavenegar dashboard
- Template must use `{token}` placeholder

### Phone Number Format
- Must be: `09XXXXXXXXX` (11 digits, starts with 09)
- No country code, no spaces, no dashes

## Verification Checklist

- [x] API Key configured in `backend/.env`
- [x] Template name configured: `otp-v2`
- [x] `NODE_ENV=production` set
- [x] Backend server restarted
- [x] Test script created and working
- [x] Error handling improved
- [x] Logging enhanced

## Production Deployment

When deploying to production:

1. **Set Environment Variables:**
   ```bash
   KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D
   KAVENEGAR_TEMPLATE=otp-v2
   NODE_ENV=production
   ```

2. **Restart Services:**
   ```bash
   docker-compose restart backend
   ```

3. **Test End-to-End:**
   - Request OTP from frontend
   - Check SMS arrives
   - Verify login works

## Support

If issues persist:
1. Check `OTP_DEBUG_GUIDE.md` for detailed troubleshooting
2. Review backend logs for specific error messages
3. Verify Kavenegar account status and credits
4. Test API key directly with Kavenegar dashboard

---

**Status:** ✅ Configuration Complete
**Next:** Test OTP flow from production server

