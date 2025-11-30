# Deploy Package Feature Fields Fix

## Quick Deployment

### Option 1: Automated Script

```bash
./scripts/deploy-package-feature-fix.sh
```

### Option 2: Manual Steps

If SSH is unstable, you can deploy manually:

```bash
# 1. Copy the file to server
scp backend/routes/admin.js root@91.107.241.245:/opt/smokava/backend/routes/

# 2. SSH into server
ssh root@91.107.241.245

# 3. Restart backend
cd /opt/smokava
docker compose restart backend

# 4. Check logs
docker compose logs backend | tail -20
```

### Option 3: Git Pull (if code is pushed)

```bash
# On server
ssh root@91.107.241.245
cd /opt/smokava
git pull
docker compose restart backend
```

## What This Fix Does

- ✅ Ensures package feature fields are saved correctly
- ✅ Ensures package feature fields are loaded correctly
- ✅ Adds logging to debug field issues
- ✅ Reloads package from database after save for consistency

## Testing After Deployment

1. Go to admin panel: `https://admin.smokava.com/package-management`
2. Select or create a package
3. Fill in the three feature fields:
   - ویژگی استفاده (feature_usage_fa)
   - ویژگی اعتبار (feature_validity_fa)
   - ویژگی پشتیبانی (feature_support_fa)
4. Click "ذخیره و به‌روزرسانی" (Save and Update)
5. Select the package again from dropdown
6. Verify all three fields are populated with your saved text

## Verification

Check backend logs to see field updates:

```bash
docker compose logs backend | grep -E "(feature_|Package saved|Package loaded)"
```

You should see logs like:
- `✅ Updated feature_usage_fa: ...`
- `💾 Package saved successfully: ...`
- `📦 Package loaded: ...`

