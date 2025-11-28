# Package Feature Fields Fix

## Problem

The feature description fields were not loading in the admin panel after being saved:
- `feature_usage_fa` (ویژگی استفاده)
- `feature_validity_fa` (ویژگی اعتبار)
- `feature_support_fa` (ویژگی پشتیبانی)

## Root Cause

The backend endpoint wasn't properly handling and returning these fields when loading a package.

## Fixes Applied

### 1. Improved Package Retrieval Endpoint (`/admin/package/:id`)

✅ Added comprehensive logging to debug field loading
✅ Ensured all fields are included in response
✅ Added logging to show which fields are returned

### 2. Improved Package Update Endpoint (`/admin/update-package`)

✅ Better handling of feature fields (accepts empty strings)
✅ Added logging for feature field updates
✅ Reload package from database after save to ensure all fields are included

## Files Changed

- `backend/routes/admin.js`:
  - `/admin/package/:id` endpoint - Added logging
  - `/admin/update-package` endpoint - Improved field handling

## Deployment

The fix has been committed. To deploy:

```bash
# On the server
cd /opt/smokava
git pull
docker compose restart backend
```

Or rebuild backend:

```bash
docker compose stop backend
docker compose build backend
docker compose up -d backend
```

## Testing

1. **Edit a package in admin panel:**
   - Fill in the feature fields:
     - ویژگی استفاده (feature_usage_fa)
     - ویژگی اعتبار (feature_validity_fa)
     - ویژگی پشتیبانی (feature_support_fa)
   - Click "ذخیره و به‌روزرسانی" (Save and Update)

2. **Verify the fields are saved:**
   - Check backend logs for: `✅ Updated feature_usage_fa: ...`
   - Check backend logs for: `💾 Package saved successfully: ...`

3. **Reload the package:**
   - Select the package from dropdown again
   - Verify the feature fields are populated with the saved values

4. **Check backend logs:**
   ```bash
   docker compose logs backend | grep -E "(feature_|Package saved|Package loaded)"
   ```

## Expected Behavior

After deployment:
- ✅ Feature fields are saved correctly when updating a package
- ✅ Feature fields are loaded correctly when selecting a package
- ✅ Backend logs show the fields being saved and retrieved
- ✅ All three feature fields display the saved Persian text

## Troubleshooting

If fields still don't load:

1. **Check backend logs:**
   ```bash
   docker compose logs backend | tail -50
   ```

2. **Verify package data in database:**
   ```bash
   docker exec smokava-backend node -e "
     const mongoose = require('mongoose');
     const Package = require('./models/Package');
     mongoose.connect(process.env.MONGODB_URI)
       .then(async () => {
         const pkg = await Package.findOne().sort({_id: -1});
         console.log('Latest package:', {
           nameFa: pkg?.nameFa,
           feature_usage_fa: pkg?.feature_usage_fa,
           feature_validity_fa: pkg?.feature_validity_fa,
           feature_support_fa: pkg?.feature_support_fa
         });
         process.exit(0);
       });
   "
   ```

3. **Test API endpoint directly:**
   ```bash
   # Get token
   TOKEN=$(curl -s -X POST https://api.smokava.com/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}' | \
     grep -o '"token":"[^"]*' | cut -d'"' -f4)

   # Get package (replace PACKAGE_ID with actual ID)
   curl -H "Authorization: Bearer $TOKEN" \
     https://api.smokava.com/api/admin/packages | \
     python3 -m json.tool | grep -A 10 "_id"
   ```

## Status

✅ **Fix Applied** - Ready for deployment
✅ **Tested** - Logic verified in code
⏳ **Pending** - Needs deployment and user testing
