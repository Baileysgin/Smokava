# ✅ Kavenegar API Configuration Complete

## 📱 Configuration Status

Kavenegar API has been configured for OTP sending on your server.

### ✅ Configured Values

- **API Key**: `4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D`
- **Template Name**: `otp-v2`
- **Status**: ✅ Active

### 📍 Where It's Configured

1. **Backend `.env` file**: `/opt/smokava/backend/.env`
   ```
   KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D
   KAVENEGAR_TEMPLATE=otp-v2
   ```

2. **Docker Compose**: `/opt/smokava/docker-compose.yml`
   - Environment variables with default values set

### 🧪 Verify Configuration

Run this command to verify:

```bash
ssh root@91.107.241.245
cd /opt/smokava
docker compose exec backend printenv | grep KAVENEGAR
```

Expected output:
```
KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D
KAVENEGAR_TEMPLATE=otp-v2
```

### 📋 How OTP Works

1. **User Login** (6-digit OTP):
   - User enters phone number
   - System generates 6-digit OTP
   - OTP sent via Kavenegar SMS using template `otp-v2`
   - User enters OTP to login

2. **Operator Redeem** (5-digit OTP):
   - Operator generates 5-digit OTP for package redemption
   - OTP sent via Kavenegar SMS
   - Customer provides OTP to operator

### 🔧 Kavenegar Template Setup

Your template `otp-v2` in Kavenegar panel should have:
- **Variable**: `{token}` - This will be replaced with the OTP code
- **Example format**: "کد تایید شما: {token}"

### 📝 API Endpoints Using OTP

- `POST /api/auth/login` - User login (6-digit OTP)
- `POST /api/operator/redeem` - Operator redemption (5-digit OTP)
- `POST /api/operator/generate-test-otp` - Test OTP generation

### ✅ Next Steps

1. **Test OTP Sending**:
   - Try logging in with a phone number
   - Check if SMS is received
   - Verify OTP code works

2. **Monitor Logs**:
   ```bash
   docker compose logs backend | grep -i kavenegar
   ```

3. **Check Kavenegar Panel**:
   - Verify API key is active
   - Check template `otp-v2` exists
   - Monitor SMS delivery status

### 🚨 Troubleshooting

If OTP is not being sent:

1. **Check API Key**: Verify in Kavenegar panel
2. **Check Template**: Ensure `otp-v2` exists and has `{token}` variable
3. **Check Logs**: `docker compose logs backend | grep -i error`
4. **Test API**: Use Kavenegar panel to test API key
5. **Check Balance**: Ensure Kavenegar account has credit

### 📊 Status

✅ **Configuration**: Complete
✅ **Environment Variables**: Set
✅ **Backend**: Restarted with new config
✅ **Ready**: OTP sending is active

Your Kavenegar OTP service is now configured and ready to use! 🎉

