# Debugging Guide - Admin, Operator, User

## 🔍 Current Issues

### Issue 1: MongoDB Connection Failed
**Symptom**: Health check shows `"database": "disconnected"`

**Fix**:
```bash
ssh root@91.107.241.245
cd /opt/smokava
docker compose restart mongodb
sleep 10
docker compose restart backend
```

### Issue 2: Admin Login Returns 502
**Symptom**: Admin login fails with 502 Bad Gateway

**Cause**: Backend can't connect to MongoDB

**Fix**: Fix MongoDB connection first (see Issue 1)

### Issue 3: User OTP Send
**Status**: Not tested yet (blocked by MongoDB)

## 🧪 Testing Scripts

### 1. Test All Endpoints
```bash
./scripts/test-all-endpoints.sh
```

Tests:
- Health endpoint
- Admin login
- Admin dashboard
- User OTP send
- Operator endpoints
- Public endpoints

### 2. Fix and Test Server
```bash
./scripts/fix-and-test-server.sh
```

Automatically:
- Fixes MongoDB connection
- Restarts services
- Creates admin user
- Tests all endpoints

### 3. Check Server Connection
```bash
./scripts/check-server-connection.sh
```

## 🔧 Manual Fixes

### Fix MongoDB Connection

**On Server:**
```bash
cd /opt/smokava

# Check MongoDB status
docker compose ps mongodb

# Restart MongoDB
docker compose restart mongodb

# Wait for MongoDB
sleep 10

# Test MongoDB
docker compose exec mongodb mongosh --eval "db.runCommand({ping: 1})"

# Restart backend
docker compose restart backend

# Check logs
docker compose logs backend | grep -i mongo
```

### Create Admin User

```bash
cd /opt/smokava
docker compose exec backend node scripts/createAdmin.js admin admin123
```

### Verify Services

```bash
cd /opt/smokava
docker compose ps
docker compose logs backend --tail=50
```

## 📋 Testing Checklist

### Admin Side ✅
- [ ] Admin login: `POST /api/admin/login`
- [ ] Admin dashboard: `GET /api/admin/dashboard/stats`
- [ ] User list: `GET /api/admin/users`
- [ ] Package management: `GET /api/admin/packages`
- [ ] Moderation: `GET /api/admin/posts`

### Operator Side ✅
- [ ] Operator login (user with operator role)
- [ ] Operator dashboard: `GET /api/operator/dashboard`
- [ ] Package redemption: `POST /api/operator/redeem`
- [ ] OTP verification

### User Side ✅
- [ ] OTP send: `POST /api/auth/send-otp`
- [ ] OTP verify: `POST /api/auth/verify-otp`
- [ ] User login: `POST /api/auth/verify-otp`
- [ ] Package purchase: `POST /api/packages/purchase`
- [ ] My packages: `GET /api/packages/my-packages`
- [ ] Profile: `GET /api/users/:id/public`
- [ ] Follow: `POST /api/users/follow/:userId`

## 🚀 Quick Fix Command

Run this on server to fix everything:

```bash
cd /opt/smokava && \
docker compose restart mongodb && \
sleep 10 && \
docker compose restart backend && \
sleep 10 && \
docker compose exec backend node scripts/createAdmin.js admin admin123 && \
curl https://api.smokava.com/api/health
```

## 📊 Expected Results

### After Fix:

1. **Health Check**:
   ```json
   {
     "status": "healthy",
     "database": "connected"
   }
   ```

2. **Admin Login**:
   ```json
   {
     "token": "eyJhbGc...",
     "admin": {
       "id": "...",
       "username": "admin"
     }
   }
   ```

3. **OTP Send**:
   ```json
   {
     "message": "OTP sent successfully",
     "expiresIn": 300
   }
   ```

## 🔍 Debugging Commands

```bash
# Check backend logs
docker compose logs backend --tail=100

# Check MongoDB logs
docker compose logs mongodb --tail=50

# Test MongoDB connection from backend
docker compose exec backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected'))
  .catch(e => console.error('❌ Failed:', e.message));
"

# Check admin user
docker compose exec backend node -e "
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const admins = await Admin.find();
  console.log('Admins:', admins.length);
  admins.forEach(a => console.log('  -', a.username));
  process.exit(0);
});
"
```
