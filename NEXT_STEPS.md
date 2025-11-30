# Next Steps - Verification & Testing

## ✅ What's Been Completed

All features have been implemented and deployed:

1. ✅ **Role System** - User/Operator/Admin with proper access control
2. ✅ **Admin Moderation** - UI for managing posts and comments
3. ✅ **Public Profiles** - Sharing, invite links, follow system
4. ✅ **PWA Support** - Add-to-home popup functionality
5. ✅ **Time-Based Packages** - Iran timezone validation
6. ✅ **Fixed Counters** - Restaurants and shisha usage tracking
7. ✅ **Admin Persistence** - Docker volume storage, auto-creation
8. ✅ **Safe Deployment** - Scripts with backups
9. ✅ **Auto-Deploy** - Automatic deployment to server
10. ✅ **OTP Fixes** - Improved error handling

## 🔍 Verification Steps

### 1. Verify Admin Login

**Test the login:**
- Go to: https://admin.smokava.com/login
- Username: `admin`
- Password: `admin123`

**If login fails:**
```bash
# SSH to server and create admin
ssh root@91.107.241.245
cd /opt/smokava
docker compose exec backend node scripts/createAdmin.js admin admin123
```

### 2. Verify Services Are Running

```bash
# Check services
ssh root@91.107.241.245 "cd /opt/smokava && docker compose ps"

# Check backend logs
ssh root@91.107.241.245 "cd /opt/smokava && docker compose logs backend --tail=50"

# Test API
curl https://api.smokava.com/api/health
```

### 3. Test OTP Sending

1. Go to: https://smokava.com/auth
2. Enter phone number: `09302593819`
3. Click "ارسال کد تایید" (Send verification code)
4. Should receive OTP (or see in console if SMS fails)

### 4. Verify Admin Panel Features

Once logged in, verify:
- ✅ Dashboard shows stats
- ✅ Users list is visible
- ✅ Packages list is visible
- ✅ Moderation section works
- ✅ Role assignment works

### 5. Test Time-Based Packages

1. Create a package with time windows
2. Activate for a user
3. Check wallet page shows remaining time
4. Verify time windows are enforced

## 🚀 Ongoing Maintenance

### Automatic Deployment

Every time you push to GitHub:
```bash
./scripts/auto-deploy-to-server.sh
```

Or enable auto-deploy:
```bash
export AUTO_DEPLOY=true
git push origin main  # Will auto-deploy
```

### Backups

Backups run automatically (if cron is set up):
```bash
# Check backup directory
ssh root@91.107.241.245 "ls -lh /var/backups/smokava/"

# Manual backup
ssh root@91.107.241.245 "cd /opt/smokava && bash scripts/db-backup.sh"
```

### Monitoring

```bash
# Check service status
ssh root@91.107.241.245 "cd /opt/smokava && docker compose ps"

# View logs
ssh root@91.107.241.245 "cd /opt/smokava && docker compose logs -f backend"

# Check health
curl https://api.smokava.com/api/health
```

## 📋 Quick Commands

### Deploy Updates
```bash
./scripts/auto-deploy-to-server.sh
```

### Check Server Connection
```bash
./scripts/check-server-connection.sh
```

### Create Admin User
```bash
ssh root@91.107.241.245 "cd /opt/smokava && docker compose exec backend node scripts/createAdmin.js admin admin123"
```

### View Logs
```bash
ssh root@91.107.241.245 "cd /opt/smokava && docker compose logs -f backend"
```

## ✅ All Features Ready

Everything has been implemented and deployed. The system is ready for use!

**Main URLs:**
- Frontend: https://smokava.com
- Admin Panel: https://admin.smokava.com
- API: https://api.smokava.com/api

**Admin Credentials:**
- Username: `admin`
- Password: `admin123`

**⚠️ Remember to change the admin password after first login!**

