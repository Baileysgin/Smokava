# ✅ Frontend API URL Fix

## 🔧 Problem Identified

The frontend was trying to connect to `http://localhost:5000/api` instead of `http://api.smokava.com/api`, causing CORS errors.

## ✅ Fixes Applied

### 1. Updated Frontend API Configuration
- **File**: `frontend/lib/api.ts`
- **Changed**: Production fallback from `https://api.mydomain.com/api` to `http://api.smokava.com/api`
- **Status**: ✅ Fixed

### 2. Updated Docker Compose
- **File**: `docker-compose.yml`
- **Changed**: `NEXT_PUBLIC_API_URL` from `http://localhost:5000/api` to `http://api.smokava.com/api`
- **Status**: ✅ Fixed

### 3. Rebuilt Frontend Container
- **Action**: Rebuilt frontend Docker image with new API URL
- **Status**: ✅ Complete

## 📋 Next Steps

1. **Restart Frontend Container** (if not already done):
   ```bash
   ssh root@91.107.241.245
   cd /opt/smokava
   docker compose up -d --force-recreate frontend
   ```

2. **Verify CORS Configuration**:
   - Backend should allow `http://smokava.com` in CORS
   - Check `backend/server.js` CORS configuration

3. **Test Login**:
   - Visit `http://smokava.com/auth`
   - Try logging in with a phone number
   - Should no longer see CORS errors

## 🧪 Verification

After restarting, check:
- ✅ No CORS errors in browser console
- ✅ API calls go to `http://api.smokava.com/api`
- ✅ Login functionality works
- ✅ No "localhost:5000" references in network tab

## 🔍 If Still Having Issues

1. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check Network Tab**: Verify requests go to `api.smokava.com`
3. **Check Backend CORS**: Ensure `http://smokava.com` is in allowed origins
4. **Check Nginx**: Verify `api.smokava.com` routes to backend correctly
