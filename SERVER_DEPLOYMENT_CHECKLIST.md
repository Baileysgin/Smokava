# Server Deployment Checklist - Admin Login Fix

## ✅ What's Been Pushed to GitHub

All admin-related fixes are committed and ready:

1. ✅ Admin user persistence (Docker volume)
2. ✅ Admin deletion protection
3. ✅ Auto-admin creation on startup
4. ✅ OTP send error fixes
5. ✅ Docker compose fixes

## 🚀 Deploy on Server

### Step 1: SSH to Server

```bash
ssh root@91.107.241.245
# or
ssh user@your-server.com
```

### Step 2: Navigate to Project

```bash
cd /opt/smokava
```

### Step 3: Pull Latest Code

```bash
git pull origin main
```

### Step 4: Deploy and Ensure Admin

```bash
bash scripts/deploy-and-ensure-admin.sh
```

This script will:
- ✅ Create database backup
- ✅ Pull latest code
- ✅ Build and deploy backend
- ✅ Create admin user if missing
- ✅ Verify admin user exists
- ✅ Run health checks

### Step 5: Verify Admin User

```bash
docker-compose exec backend node scripts/createAdmin.js admin admin123
```

You should see: `Admin with username "admin" already exists` or `✅ Admin created successfully!`

### Step 6: Test Login

```bash
curl -X POST https://api.smokava.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Should return a token.

## 🔍 Troubleshooting

### Admin User Not Found

```bash
# Manually create admin
docker-compose exec backend node scripts/createAdmin.js admin admin123

# Verify it exists
docker-compose exec backend node -e "
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const admin = await Admin.findOne({ username: 'admin' });
  console.log(admin ? '✅ Admin exists' : '❌ Admin not found');
  process.exit(0);
});
"
```

### Backend Not Starting

```bash
# Check logs
docker-compose logs backend --tail=50

# Restart backend
docker-compose restart backend

# Check status
docker-compose ps
```

### Login Still Fails

1. **Check API URL in admin panel:**
   - Should be: `https://api.smokava.com/api`
   - Check browser console for errors

2. **Check CORS:**
   - Verify `https://admin.smokava.com` is in `ALLOWED_ORIGINS`

3. **Check backend logs:**
   ```bash
   docker-compose logs backend | grep -i "login\|admin"
   ```

4. **Test API directly:**
   ```bash
   curl -X POST https://api.smokava.com/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

## 📋 Admin Credentials

- **Username:** `admin`
- **Password:** `admin123`

**⚠️ Change password after first login!**

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend is running: `docker-compose ps backend`
- [ ] Admin user exists: Check with script above
- [ ] API health check: `curl https://api.smokava.com/api/health`
- [ ] Login API works: Test with curl above
- [ ] Admin panel accessible: `https://admin.smokava.com`
- [ ] Can login with admin/admin123

## 🎯 Quick Deploy Command

```bash
ssh root@91.107.241.245 "cd /opt/smokava && git pull origin main && bash scripts/deploy-and-ensure-admin.sh"
```
