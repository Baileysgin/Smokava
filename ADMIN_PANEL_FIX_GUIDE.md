# Admin Panel Data Loading Fix - Complete Guide

## Problem Summary

The admin panel at `https://admin.smokava.com` was not receiving any data:
- `/users` returned empty arrays
- `/packages` returned empty arrays  
- `/sold-packages` returned empty arrays
- No errors were thrown, but data was missing

## Root Causes Identified

1. **VITE_API_URL not set in container** - The admin panel container was built without the proper API URL environment variable
2. **API URL fallback issues** - The fallback logic wasn't working correctly
3. **Possible CORS issues** - Need to ensure CORS is properly configured

## Fixes Applied

### 1. Admin Panel API Configuration (`admin-panel/src/lib/api.ts`)

✅ **Fixed API URL resolution:**
- Added better logging to debug API URL issues
- Added fallback to production URL if not set
- Ensured API URL always ends with `/api`
- Better error messages

### 2. Vite Configuration (`admin-panel/vite.config.ts`)

✅ **Fixed build-time environment variable injection:**
- Improved API URL normalization
- Added logging during build
- Ensured HTTPS URLs in production

### 3. Docker Compose Configuration (`docker-compose.yml`)

✅ **Fixed environment variable passing:**
- Changed build args format for better compatibility
- Added explicit environment variable in container
- Set default value to `https://api.smokava.com/api`

### 4. Backend Routes (`backend/routes/admin.js`)

✅ **Added better logging:**
- Added console logs for debugging API requests
- Better error messages
- Logs number of records found

## Deployment Steps

### Step 1: Update Environment Variables

Ensure you have a `.env` file in the project root (or set environment variables):

```bash
# Admin Panel API URL
VITE_API_URL=https://api.smokava.com/api

# Backend CORS
ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
```

### Step 2: Rebuild Admin Panel

**Option A: Using the fix script (recommended):**

```bash
cd /path/to/Smokava
export VITE_API_URL=https://api.smokava.com/api
./scripts/fix-admin-panel.sh
```

**Option B: Manual rebuild:**

```bash
# Stop and remove existing container
docker compose stop admin-panel
docker compose rm -f admin-panel

# Rebuild with correct environment
export VITE_API_URL=https://api.smokava.com/api
docker compose build --no-cache admin-panel

# Start container
docker compose up -d admin-panel
```

### Step 3: Verify Deployment

1. **Check container is running:**
   ```bash
   docker ps | grep smokava-admin-panel
   ```

2. **Check logs:**
   ```bash
   docker compose logs admin-panel | tail -20
   ```

3. **Test API URL in browser console:**
   - Open `https://admin.smokava.com`
   - Open browser DevTools (F12)
   - Go to Console tab
   - You should see: `✅ Using API URL: https://api.smokava.com/api`

4. **Test API endpoints:**
   ```bash
   # Get auth token
   TOKEN=$(curl -s -X POST https://api.smokava.com/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}' | \
     grep -o '"token":"[^"]*' | cut -d'"' -f4)

   # Test users endpoint
   curl -H "Authorization: Bearer $TOKEN" \
     https://api.smokava.com/api/admin/users?page=1&limit=5

   # Test packages endpoint
   curl -H "Authorization: Bearer $TOKEN" \
     https://api.smokava.com/api/admin/packages
   ```

### Step 4: Verify Database Has Data

If endpoints return empty arrays, the database might be empty:

```bash
# Check users in database
docker exec smokava-backend node -e "
  const mongoose = require('mongoose');
  const User = require('./models/User');
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava')
    .then(() => User.countDocuments())
    .then(count => { console.log('Users:', count); process.exit(0); })
    .catch(e => { console.error(e); process.exit(1); });
"

# Check packages in database
docker exec smokava-backend node -e "
  const mongoose = require('mongoose');
  const Package = require('./models/Package');
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava')
    .then(() => Package.countDocuments())
    .then(count => { console.log('Packages:', count); process.exit(0); })
    .catch(e => { console.error(e); process.exit(1); });
"
```

If database is empty, seed it:
```bash
docker exec smokava-backend npm run seed
# or
docker exec smokava-backend node scripts/seed.js
```

## Verification Checklist

- [ ] Admin panel container is running
- [ ] VITE_API_URL is set to `https://api.smokava.com/api`
- [ ] Admin panel loads without console errors
- [ ] Login works successfully
- [ ] `/admin/users` endpoint returns data (or empty array if no users)
- [ ] `/admin/packages` endpoint returns data (or empty array if no packages)
- [ ] `/admin/sold-packages` endpoint returns data
- [ ] Admin panel UI displays data correctly
- [ ] CORS headers are present in API responses

## Troubleshooting

### Empty Arrays Returned

If API endpoints return empty arrays:

1. **Check database connection:**
   ```bash
   docker exec smokava-backend node -e "
     const mongoose = require('mongoose');
     mongoose.connect(process.env.MONGODB_URI)
       .then(() => console.log('✅ Connected'))
       .catch(e => console.error('❌ Error:', e));
   "
   ```

2. **Check if database has data:**
   - Run the database verification commands above
   - If empty, seed the database

3. **Check backend logs:**
   ```bash
   docker compose logs backend | grep -E "(users|packages|error)"
   ```

### CORS Errors

If you see CORS errors in browser console:

1. **Verify CORS configuration in backend:**
   ```bash
   docker exec smokava-backend printenv | grep -E "(ALLOWED_ORIGINS|ADMIN_PANEL_URL)"
   ```

2. **Check Nginx CORS headers:**
   - Nginx config should allow CORS for API requests
   - Check `/etc/nginx/sites-enabled/api.smokava.com` on server

### API URL Not Set

If console shows API URL as undefined or localhost:

1. **Check environment variable:**
   ```bash
   docker exec smokava-admin-panel printenv | grep VITE_API_URL
   ```

2. **Rebuild container:**
   - Stop and remove container
   - Rebuild with correct VITE_API_URL
   - Restart container

## Files Modified

1. `admin-panel/src/lib/api.ts` - Improved API URL resolution
2. `admin-panel/vite.config.ts` - Better build-time environment handling
3. `docker-compose.yml` - Fixed environment variable passing
4. `backend/routes/admin.js` - Added logging for debugging

## Next Steps

After deploying these fixes:

1. Monitor backend logs for API requests
2. Check browser console for any remaining errors
3. Verify all admin panel pages load data correctly
4. Test user management, package management, and other features

## Support

If issues persist:
1. Check backend logs: `docker compose logs backend`
2. Check admin panel logs: `docker compose logs admin-panel`
3. Check browser console for client-side errors
4. Verify network requests in browser DevTools Network tab

