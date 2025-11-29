# 🔍 OTP System Investigation - Complete Report

## EXACT CAUSE OF FAILURE

### Primary Root Cause:
**Docker container environment variables contain PLACEHOLDER values instead of real Kavenegar credentials.**

**Evidence:**
```bash
docker exec smokava-backend printenv | grep KAVENEGAR
# Output:
KAVENEGAR_API_KEY=your-kavenegar-api-key-here  ❌ (PLACEHOLDER)
KAVENEGAR_TEMPLATE=your-template-name-here    ❌ (PLACEHOLDER)
```

**Should be:**
```bash
KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D  ✅
KAVENEGAR_TEMPLATE=otp-v2  ✅
```

### What Happens:
1. Backend receives OTP request
2. Generates OTP code ✅
3. Saves to database ✅
4. Tries to send SMS via Kavenegar
5. Uses placeholder API key: `your-kavenegar-api-key-here`
6. Kavenegar API returns: **404 - متد نامشخص است** (Method not found)
7. SMS fails ❌
8. User never receives code ❌
9. Verification fails ❌

## ✅ FIXES APPLIED TO CODE

### 1. Backend Routes (`backend/routes/auth.js`)

**BEFORE:**
```javascript
// Send OTP via Kavenegar
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  await sendOTP(phoneNumber, otpCode);
}
```

**AFTER:**
```javascript
// Send OTP via Kavenegar
// Always try to send SMS if credentials are available
const hasKavenegarCredentials = process.env.KAVENEGAR_API_KEY && process.env.KAVENEGAR_TEMPLATE;
if (hasKavenegarCredentials) {
  try {
    await sendOTP(phoneNumber, otpCode);
    console.log('✅ SMS sent successfully to:', phoneNumber);
  } catch (err) {
    // Better error handling
  }
}
```

**BEFORE:**
```javascript
if (user.otpCode !== code) {
  return res.status(400).json({ message: 'Invalid code' });
}
```

**AFTER:**
```javascript
const providedCode = String(code).trim();
const expectedCode = String(user.otpCode).trim();

if (providedCode !== expectedCode) {
  // Better logging with type information
  return res.status(400).json({ message: 'Invalid code' });
}
```

### 2. Docker Compose (`docker-compose.yml`)

**BEFORE:**
```yaml
- KAVENEGAR_API_KEY=${KAVENEGAR_API_KEY}
- KAVENEGAR_TEMPLATE=${KAVENEGAR_TEMPLATE}
```

**AFTER:**
```yaml
- KAVENEGAR_API_KEY=${KAVENEGAR_API_KEY:-4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D}
- KAVENEGAR_TEMPLATE=${KAVENEGAR_TEMPLATE:-otp-v2}
```

### 3. Frontend (`frontend/lib/api.ts`)

**Status:** ✅ Already correct
- Uses `NEXT_PUBLIC_API_URL` environment variable
- HTTPS validation in production
- No hardcoded localhost

## 📋 FILES CHANGED

1. ✅ `backend/routes/auth.js` - Improved OTP sending and verification logic
2. ✅ `backend/services/kavenegar.js` - Already had good error handling
3. ✅ `docker-compose.yml` - Added default Kavenegar credentials
4. ✅ `frontend/lib/api.ts` - Already using environment variables correctly
5. ✅ `frontend/store/authStore.ts` - Already correct
6. ✅ `frontend/app/auth/page.tsx` - Already correct

## 🚀 DEPLOYMENT STATUS

### Completed:
- ✅ Code fixes applied locally
- ✅ Files uploaded to server
- ✅ Backend .env file updated on server
- ✅ docker-compose.yml updated on server

### Pending:
- ⏭️ **Backend container needs to be recreated with correct environment variables**
- ⏭️ **Frontend container may need rebuild if environment changed**

## 🔧 MANUAL FIX REQUIRED

The backend container must be recreated with the correct environment variables. Run this on the server:

```bash
cd /opt/smokava

# Stop and remove old container
docker stop smokava-backend
docker rm smokava-backend

# Recreate with correct environment
docker run -d \
  --name smokava-backend \
  --network smokava_smokava-network \
  --restart unless-stopped \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e MONGODB_URI=mongodb://mongodb:27017/smokava \
  -e JWT_SECRET=your-super-secret-jwt-key-change-in-production \
  -e KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D \
  -e KAVENEGAR_TEMPLATE=otp-v2 \
  -e FRONTEND_URL=https://smokava.com \
  -e ADMIN_PANEL_URL=https://admin.smokava.com \
  -e ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com \
  -v /opt/smokava/backend:/app \
  -v /app/node_modules \
  smokava-backend:latest \
  node server.js

# Verify
docker exec smokava-backend printenv | grep KAVENEGAR
# Should show the real API key, not placeholder
```

## 🧪 VERIFICATION

### Test 1: Check Environment Variables
```bash
docker exec smokava-backend printenv | grep KAVENEGAR
# Expected: Real API key and template
```

### Test 2: Test send-otp Endpoint
```bash
curl -X POST https://api.smokava.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"09302593819"}'
# Expected: {"message":"OTP sent successfully","expiresIn":300}
# Should NOT have smsError
```

### Test 3: Check Backend Logs
```bash
docker logs smokava-backend | grep -E '(Kavenegar|SMS|OTP)' | tail -20
# Should show: ✅ SMS sent successfully
# Should NOT show: 404 errors
```

### Test 4: Full Login Flow
1. Go to: https://smokava.com/auth
2. Enter phone: 09302593819
3. Request OTP
4. **Check phone for SMS** ✅
5. Enter code
6. Login should succeed ✅

## 📊 BEFORE/AFTER COMPARISON

### BEFORE:
| Component | Status | Issue |
|-----------|--------|-------|
| Environment Variables | ❌ Placeholder values | `your-kavenegar-api-key-here` |
| SMS Sending | ❌ Fails | 404 error from Kavenegar |
| OTP Generation | ✅ Works | Code generated correctly |
| OTP Storage | ✅ Works | Saved to database |
| OTP Verification | ❌ Fails | No SMS = no code to verify |
| User Experience | ❌ Broken | No SMS received |

### AFTER (After Container Recreation):
| Component | Status | Expected Result |
|-----------|--------|-----------------|
| Environment Variables | ✅ Real values | Actual API key and template |
| SMS Sending | ✅ Should work | Kavenegar API accepts request |
| OTP Generation | ✅ Works | Code generated correctly |
| OTP Storage | ✅ Works | Saved to database |
| OTP Verification | ✅ Should work | Code matches, login succeeds |
| User Experience | ✅ Should work | SMS received, login works |

## ✅ CONFIRMATION CHECKLIST

After recreating the container:

- [ ] Environment variables show real API key (not placeholder)
- [ ] send-otp endpoint returns success without smsError
- [ ] Backend logs show "✅ SMS sent successfully"
- [ ] SMS is received on phone
- [ ] verify-otp endpoint accepts the code
- [ ] Full login flow works end-to-end

## 🎯 SUMMARY

**Root Cause:** Docker container had placeholder environment variables instead of real Kavenegar credentials.

**Solution:** Recreate backend container with correct environment variables.

**Code Status:** ✅ All code fixes complete and deployed.

**Deployment Status:** ⏭️ Container recreation required.

**Next Action:** Recreate backend container with correct environment variables using the command above.

---

**All code fixes are complete. The only remaining step is to recreate the backend container with the correct environment variables on the production server.**


