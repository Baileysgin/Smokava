# Production Debug Report - 502 Bad Gateway

## 🔍 Issue Identified

**Date**: 2025-12-01  
**Status**: 502 Bad Gateway on all production domains

## Root Cause

### Port Mismatch Between Docker and Nginx

1. **Docker Compose Configuration** (`docker-compose.yml`):
   - Backend is mapped to: `5001:5000` (external port 5001, internal port 5000)
   - Frontend is mapped to: `3000:3000` ✅ (correct)
   - Admin panel is mapped to: `5173:80` ✅ (correct)

2. **Nginx Configuration** (`nginx/smokava-docker.conf`):
   - API backend expects: `localhost:5000` ❌ (wrong - should be 5001)
   - Frontend expects: `localhost:3000` ✅ (correct)
   - Admin panel expects: `localhost:5173` ✅ (correct)

### The Problem

Nginx is trying to proxy to `http://localhost:5000` but Docker is exposing the backend on `localhost:5001`, causing 502 Bad Gateway errors.

## 🔧 Solution Options

### Option 1: Fix Docker Compose (Recommended)
Change backend port mapping from `5001:5000` to `5000:5000` to match nginx expectations.

### Option 2: Fix Nginx Config
Change nginx proxy_pass from `localhost:5000` to `localhost:5001`.

**Recommendation**: Use Option 1 (fix docker-compose) as it's cleaner and matches the nginx config.

## 🚀 Quick Fix Commands

### On Production Server (SSH):

```bash
cd /opt/smokava

# 1. Pull latest code
git pull

# 2. Fix docker-compose.yml (change 5001:5000 to 5000:5000)
sed -i 's/"5001:5000"/"5000:5000"/g' docker-compose.yml

# 3. Restart backend with new port mapping
docker compose stop backend
docker compose up -d backend

# 4. Wait for backend to be ready
sleep 10

# 5. Test backend locally
curl http://localhost:5000/api/health

# 6. Test all services
curl http://localhost:5000/          # Backend API
curl http://localhost:3000/          # Frontend
curl http://localhost:5173/           # Admin Panel

# 7. Reload nginx
sudo nginx -t && sudo systemctl reload nginx

# 8. Test production URLs
curl -I https://api.smokava.com/api/health
curl -I https://smokava.com
curl -I https://admin.smokava.com
```

## 📋 Verification Checklist

After applying the fix, verify:

- [ ] Backend responds on `localhost:5000`
- [ ] Frontend responds on `localhost:3000`
- [ ] Admin panel responds on `localhost:5173`
- [ ] `https://api.smokava.com` returns 200 (not 502)
- [ ] `https://smokava.com` returns 200 (not 502)
- [ ] `https://admin.smokava.com` returns 200 (not 502)

## 🐛 Additional Checks

If still getting 502 errors after port fix:

1. **Check if containers are running:**
   ```bash
   docker compose ps
   ```

2. **Check container logs:**
   ```bash
   docker compose logs backend
   docker compose logs frontend
   docker compose logs admin-panel
   ```

3. **Check nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Verify nginx config:**
   ```bash
   sudo nginx -t
   sudo grep -r "proxy_pass" /etc/nginx/sites-enabled/
   ```

5. **Check if ports are accessible:**
   ```bash
   netstat -tlnp | grep -E "5000|3000|5173"
   ```

## 📝 Files to Update

1. **docker-compose.yml** - Line 29:
   ```yaml
   # Change from:
   ports:
     - "5001:5000"
   # To:
   ports:
     - "5000:5000"
   ```

## 🔄 Alternative: If Port 5000 is Already in Use

If port 5000 is already used by another service, update nginx config instead:

```bash
# Update nginx config to use port 5001
sudo sed -i 's/localhost:5000/localhost:5001/g' /etc/nginx/sites-enabled/smokava-docker.conf
sudo nginx -t && sudo systemctl reload nginx
```

## ✅ Expected Results After Fix

- ✅ `https://api.smokava.com/api/health` returns: `{"status":"healthy",...}`
- ✅ `https://smokava.com` loads the frontend
- ✅ `https://admin.smokava.com` loads the admin panel
- ✅ No more 502 errors

## 📞 Next Steps

1. SSH into production server
2. Run the quick fix commands above
3. Verify all URLs work
4. Test the full application flow

