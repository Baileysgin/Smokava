# Deploy Fixes - Step by Step Guide

## 🎯 What We're Deploying

1. **Backend Fix**: Package feature fields (`feature_usage_fa`, `feature_validity_fa`, `feature_support_fa`) now load correctly
2. **Admin Panel Fix**: API URL configuration fixed

## 🚀 Option 1: Deploy via SSH Script (When Network is Stable)

```bash
# Make scripts executable
chmod +x scripts/deploy-via-git.sh
chmod +x scripts/deploy-all-fixes.sh

# Try deployment (may need multiple attempts due to SSH instability)
./scripts/deploy-via-git.sh
```

If that fails, try:
```bash
./scripts/deploy-all-fixes.sh
```

## 📋 Option 2: Manual Deployment via SSH

### Step 1: Connect to Server
```bash
ssh root@91.107.241.245
# Password: pqwRU4qhpVW7
```

### Step 2: Navigate to Project
```bash
cd /opt/smokava
```

### Step 3: Pull Latest Code (if using git)
```bash
git pull origin main
```

### Step 4: Restart Backend
```bash
docker compose restart backend
```

### Step 5: Rebuild Admin Panel
```bash
export VITE_API_URL=https://api.smokava.com/api
docker compose build --no-cache admin-panel
docker compose up -d admin-panel
```

### Step 6: Check Status
```bash
docker ps | grep smokava
docker compose logs --tail=50 backend
docker compose logs --tail=50 admin-panel
```

## 📁 Option 3: Manual File Copy (If Git Pull Fails)

### Copy Backend File
From your local machine:
```bash
scp backend/routes/admin.js root@91.107.241.245:/opt/smokava/backend/routes/admin.js
```

### Copy Admin Panel Files
```bash
scp admin-panel/src/lib/api.ts root@91.107.241.245:/opt/smokava/admin-panel/src/lib/api.ts
scp admin-panel/vite.config.ts root@91.107.241.245:/opt/smokava/admin-panel/vite.config.ts
scp admin-panel/Dockerfile root@91.107.241.245:/opt/smokava/admin-panel/Dockerfile
scp docker-compose.yml root@91.107.241.245:/opt/smokava/docker-compose.yml
```

Then SSH and rebuild:
```bash
ssh root@91.107.241.245
cd /opt/smokava
docker compose restart backend
export VITE_API_URL=https://api.smokava.com/api
docker compose build --no-cache admin-panel
docker compose up -d admin-panel
```

## ✅ Verification Steps

### 1. Test Admin Panel
- Go to: https://admin.smokava.com
- Login with: `admin` / `admin123`
- Check browser console (F12) - should see: `✅ Using API URL: https://api.smokava.com/api`

### 2. Test Package Feature Fields
- Go to Package Management page
- Select or create a package
- Fill in these fields:
  - ویژگی استفاده (feature_usage_fa)
  - ویژگی اعتبار (feature_validity_fa)
  - ویژگی پشتیبانی (feature_support_fa)
- Click Save
- Select the package again
- ✅ All three fields should now show your saved text

## 🔍 Troubleshooting

### If backend doesn't restart:
```bash
docker compose stop backend
docker compose build backend
docker compose up -d backend
```

### If admin panel doesn't rebuild:
```bash
docker compose stop admin-panel
docker compose rm -f admin-panel
export VITE_API_URL=https://api.smokava.com/api
docker compose build --no-cache admin-panel
docker compose up -d admin-panel
```

### Check logs:
```bash
docker compose logs --tail=100 backend
docker compose logs --tail=100 admin-panel
```

## 📝 Files Changed

- ✅ `backend/routes/admin.js` - Package feature fields handling
- ✅ `admin-panel/src/lib/api.ts` - API URL configuration
- ✅ `admin-panel/vite.config.ts` - Build configuration
- ✅ `admin-panel/Dockerfile` - Environment variable support
- ✅ `docker-compose.yml` - Admin panel environment variables

All files are committed locally and ready for deployment.

## 🎯 Quick Command Summary

```bash
# On server:
cd /opt/smokava
git pull origin main  # or copy files manually
docker compose restart backend
export VITE_API_URL=https://api.smokava.com/api
docker compose build --no-cache admin-panel
docker compose up -d admin-panel
```
