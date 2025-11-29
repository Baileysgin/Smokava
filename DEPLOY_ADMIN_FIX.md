# 🚀 Deploy Admin Panel Fix - Quick Guide

## The Fix

I've fixed the admin panel data loading issues. The main problem was that `VITE_API_URL` wasn't being set correctly in the admin panel container.

## Quick Deployment

### Option 1: Automated Script (Recommended)

```bash
# Set API URL
export VITE_API_URL=https://api.smokava.com/api

# Run fix script
./scripts/fix-admin-panel.sh
```

### Option 2: Manual Steps

```bash
# 1. Stop admin panel
docker compose stop admin-panel
docker compose rm -f admin-panel

# 2. Set environment
export VITE_API_URL=https://api.smokava.com/api

# 3. Rebuild
docker compose build --no-cache admin-panel

# 4. Start
docker compose up -d admin-panel

# 5. Verify
docker ps | grep admin-panel
```

## What Was Fixed

1. ✅ **Admin Panel API Configuration** - Better API URL resolution
2. ✅ **Docker Environment Variables** - Properly pass VITE_API_URL
3. ✅ **Backend Logging** - Added logs for debugging
4. ✅ **Build Configuration** - Fixed Vite config for production

## Verify It Works

1. **Check browser console:**
   - Open https://admin.smokava.com
   - Press F12 → Console
   - Should see: `✅ Using API URL: https://api.smokava.com/api`

2. **Test API endpoints:**
   ```bash
   # Get token
   TOKEN=$(curl -s -X POST https://api.smokava.com/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}' | \
     grep -o '"token":"[^"]*' | cut -d'"' -f4)

   # Test users
   curl -H "Authorization: Bearer $TOKEN" \
     https://api.smokava.com/api/admin/users

   # Test packages
   curl -H "Authorization: Bearer $TOKEN" \
     https://api.smokava.com/api/admin/packages
   ```

## If Data is Still Empty

The database might be empty. Check and seed if needed:

```bash
# Check database
docker exec smokava-backend node -e "
  const mongoose = require('mongoose');
  const User = require('./models/User');
  const Package = require('./models/Package');
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Users:', await User.countDocuments());
      console.log('Packages:', await Package.countDocuments());
      process.exit(0);
    });
"

# Seed if empty
docker exec smokava-backend npm run seed
```

## Files Changed

- `admin-panel/src/lib/api.ts` - API URL resolution
- `admin-panel/vite.config.ts` - Build config
- `docker-compose.yml` - Environment variables
- `backend/routes/admin.js` - Logging
- `scripts/fix-admin-panel.sh` - Deployment script

## Next Steps

1. ✅ Deploy the fix (run script above)
2. ✅ Verify admin panel loads data
3. ✅ Check browser console for any errors
4. ✅ Test all admin panel features

---

**Ready to deploy!** Run the fix script and the admin panel should start loading data correctly. 🎉
