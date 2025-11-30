# 🚀 Deploy Performance Optimizations

## Quick Deploy Guide

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Admin Panel
cd admin-panel
npm install
```

### Step 2: Rebuild Admin Panel

```bash
cd admin-panel
npm run build
```

This will create:
- Optimized chunks (code splitting)
- Gzip compressed files (.gz)
- Brotli compressed files (.br)
- Minified code (no console.logs)

### Step 3: Deploy to Server

```bash
# SSH to server
ssh root@91.107.241.245

# Update Nginx config
cd /opt/smokava
git pull origin main
sudo cp nginx/smokava-docker.conf /etc/nginx/sites-available/smokava
sudo nginx -t
sudo systemctl reload nginx

# Install backend compression package
cd backend
npm install

# Restart backend
docker compose restart backend
# OR if using PM2:
# pm2 restart smokava-backend

# Deploy new admin panel build (from local machine)
cd admin-panel
npm run build
scp -r dist/* root@91.107.241.245:/var/www/smokava-admin-panel/

# On server: Set permissions
sudo chown -R www-data:www-data /var/www/smokava-admin-panel
sudo chmod -R 755 /var/www/smokava-admin-panel
```

## 🎯 What Changed

### Frontend (Admin Panel)
- ✅ All routes lazy-loaded (except login)
- ✅ Code splitting (smaller initial bundle)
- ✅ Gzip + Brotli compression
- ✅ Minified code (no console.logs)
- ✅ Optimized chunk names

### Backend
- ✅ Gzip compression middleware
- ✅ Dashboard stats caching (5 min)
- ✅ Operator dashboard caching (3 min)

### Nginx
- ✅ HTTP/2 enabled
- ✅ Long-term caching (1 year for assets)
- ✅ Gzip static files
- ✅ Optimized proxy settings

## 📊 Expected Results

- **Initial Load**: 40-60% faster
- **Bundle Size**: 30-50% smaller
- **API Calls**: 20-30% faster (cached)
- **Subsequent Loads**: 70-80% faster

## ✅ Verify Deployment

```bash
# Check if compressed files exist
ls -lh /var/www/smokava-admin-panel/assets/*.gz

# Test compression
curl -H "Accept-Encoding: gzip" -I http://admin.smokava.com

# Check caching headers
curl -I http://admin.smokava.com/assets/js/*.js
```

## 🔄 Rollback (if needed)

```bash
# Restore old build
cd /var/www/smokava-admin-panel
sudo mv backup/* .

# Or rebuild without optimizations
cd /opt/smokava/admin-panel
# Temporarily disable optimizations in vite.config.ts
npm run build
```



