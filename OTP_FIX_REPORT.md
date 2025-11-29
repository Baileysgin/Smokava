# OTP System Fix - Complete Investigation Report

## 🔍 ROOT CAUSE IDENTIFIED

### Primary Issue: Environment Variables Not Set in Docker Container

**Problem Found:**
The production Docker container has **placeholder values** instead of real Kavenegar credentials:
- `KAVENEGAR_API_KEY: "your-kavenegar-api-k..."` ❌ (placeholder)
- `KAVENEGAR_TEMPLATE: "your-template-name-here"` ❌ (placeholder)

**Correct Values Should Be:**
- `KAVENEGAR_API_KEY: "4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D"` ✅
- `KAVENEGAR_TEMPLATE: "otp-v2"` ✅

### Secondary Issues Found:

1. **User Creation Error**: MongoDB duplicate key error for username field (non-blocking, but causes warnings)
2. **OTP Verification**: Code comparison logic improved (already fixed in code)

## ✅ FIXES APPLIED

### 1. Backend Code Fixes

**File: `backend/routes/auth.js`**
- ✅ Improved OTP verification with string trimming
- ✅ Better error logging
- ✅ Fixed SMS sending logic to always try when credentials available

**File: `backend/services/kavenegar.js`**
- ✅ Enhanced error handling
- ✅ Better logging for debugging
- ✅ Correct API endpoint: `https://api.kavenegar.com/v1/{API_KEY}/verify/lookup.json`

**File: `docker-compose.yml`**
- ✅ Added default values for Kavenegar credentials
- ✅ Changed API_BASE_URL default to HTTPS
- ✅ Added FRONTEND_URL and ADMIN_PANEL_URL

### 2. Frontend Code Status

**File: `frontend/lib/api.ts`**
- ✅ Uses `NEXT_PUBLIC_API_URL` environment variable
- ✅ HTTPS validation in production
- ✅ No hardcoded localhost in production

**File: `frontend/store/authStore.ts`**
- ✅ Correctly calls `/auth/send-otp` and `/auth/verify-otp`
- ✅ Proper error handling

**File: `frontend/app/auth/page.tsx`**
- ✅ Shows SMS errors to users
- ✅ Handles OTP verification flow

### 3. Kavenegar Integration Verified

**API Key:** ✅ Valid (tested with account/info endpoint)
**Template:** ✅ `otp-v2` (confirmed working)
**Endpoint:** ✅ `https://api.kavenegar.com/v1/{API_KEY}/verify/lookup.json`
**Parameters:** ✅ Correct (receptor, token, template)

**Direct API Test Result:**
```json
{
  "return": {
    "status": 200,
    "message": "تایید شد"
  },
  "entries": [{
    "messageid": 1234939371,
    "status": 5,
    "statustext": "ارسال به مخابرات"
  }]
}
```

## 📋 FILES CHANGED

### Backend Files:
1. ✅ `backend/routes/auth.js` - Improved OTP logic and SMS sending
2. ✅ `backend/services/kavenegar.js` - Enhanced error handling (already good)
3. ✅ `docker-compose.yml` - Added default Kavenegar credentials

### Frontend Files:
- ✅ Already using environment variables correctly
- ✅ No hardcoded localhost values

## 🚀 DEPLOYMENT STEPS REQUIRED

### Step 1: Update docker-compose.yml on Server
```bash
# File already updated locally with correct defaults
# Need to upload to server
```

### Step 2: Update Backend .env on Server
```bash
KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D
KAVENEGAR_TEMPLATE=otp-v2
NODE_ENV=production
```

### Step 3: Restart Backend Container
```bash
cd /opt/smokava
docker-compose down backend
docker-compose up -d backend
```

### Step 4: Verify Environment Variables
```bash
docker exec smokava-backend node -e "require('dotenv').config(); console.log('API Key:', process.env.KAVENEGAR_API_KEY ? 'SET' : 'NOT SET'); console.log('Template:', process.env.KAVENEGAR_TEMPLATE);"
```

## 🧪 TESTING RESULTS

### Local Testing:
- ✅ Kavenegar API key works
- ✅ Template name correct
- ✅ API endpoint format correct
- ✅ Direct curl test successful (SMS sent)

### Production Testing Needed:
- ⏭️ Test send-otp endpoint after environment fix
- ⏭️ Verify SMS is received
- ⏭️ Test verify-otp endpoint
- ⏭️ Test full login flow

## 📝 EXACT CAUSE OF FAILURE

**The OTP system was failing because:**

1. **Docker container environment variables were placeholders:**
   - Container had: `KAVENEGAR_API_KEY=your-kavenegar-api-key-here`
   - Should have: `KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D`

2. **When backend tried to send SMS:**
   - Used placeholder API key → Kavenegar returned 404
   - Error: "Request failed with status code 404"

3. **OTP was still saved to database:**
   - But SMS never sent
   - User couldn't receive code
   - Verification failed because code mismatch or expiration

## ✅ SOLUTION

**Fix docker-compose.yml to include default values:**
```yaml
- KAVENEGAR_API_KEY=${KAVENEGAR_API_KEY:-4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D}
- KAVENEGAR_TEMPLATE=${KAVENEGAR_TEMPLATE:-otp-v2}
```

**OR ensure backend/.env file on server has correct values and restart container.**

## 🎯 NEXT STEPS

1. ✅ Code fixes complete
2. ⏭️ Deploy updated docker-compose.yml to server
3. ⏭️ Restart backend container
4. ⏭️ Test OTP flow end-to-end
5. ⏭️ Verify SMS delivery

## 📊 BEFORE/AFTER

### BEFORE:
- ❌ Environment variables: Placeholder values
- ❌ SMS sending: Failed with 404
- ❌ OTP verification: Failed (no SMS sent)
- ❌ User experience: No SMS received

### AFTER (After Deployment):
- ✅ Environment variables: Real Kavenegar credentials
- ✅ SMS sending: Should work (API tested successfully)
- ✅ OTP verification: Should work (code comparison fixed)
- ✅ User experience: SMS received, login works

---

**Status:** Code fixes complete, deployment pending
**Critical:** Must update environment variables on production server


