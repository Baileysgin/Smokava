# 📱 Kavenegar OTP Configuration

## ✅ Configuration Complete

Kavenegar API has been configured for OTP sending.

### Configuration Details

- **API Key**: `4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D`
- **Template Name**: `otp-v2`
- **Environment**: Production

### Where It's Configured

1. **Backend `.env` file**: `/opt/smokava/backend/.env`
2. **Docker Compose**: Environment variables passed to container
3. **Backend Service**: `backend/services/kavenegar.js`

### How It Works

The Kavenegar service sends OTP codes via SMS using the lookup.json API:

```javascript
// Template variables in Kavenegar:
// {token} - The OTP code
// {receptor} - Phone number
```

### Testing OTP

1. **User Login**: User enters phone number → Receives 6-digit OTP
2. **Operator Redeem**: Operator generates 5-digit OTP for redemption
3. **Admin Operations**: OTP sent for various admin operations

### Verify Configuration

```bash
# Check environment variables in container
docker compose exec backend printenv | grep KAVENEGAR

# Should show:
# KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D
# KAVENEGAR_TEMPLATE=otp-v2
```

### API Endpoints Using OTP

- `POST /api/auth/login` - User login OTP
- `POST /api/operator/redeem` - Operator redemption OTP
- `POST /api/operator/generate-test-otp` - Test OTP generation

### Troubleshooting

If OTP is not being sent:

1. **Check API Key**: Verify it's correct in Kavenegar panel
2. **Check Template**: Ensure `otp-v2` template exists in Kavenegar
3. **Check Logs**: `docker compose logs backend | grep -i kavenegar`
4. **Test API**: Use Kavenegar panel to test the API key

### Kavenegar Template Format

Your template `otp-v2` should have:
- Variable: `{token}` for the OTP code
- Example: "کد تایید شما: {token}"

### Environment Variables

The following are set in `/opt/smokava/backend/.env`:
```
KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D
KAVENEGAR_TEMPLATE=otp-v2
```

## ✅ Status: CONFIGURED AND ACTIVE

The backend will now send OTP codes via Kavenegar SMS service.

