# Post-Deployment Verification Checklist

After deploying to production, verify all features are working correctly.

## 🔍 Quick Health Checks

```bash
# 1. API Health
curl https://api.smokava.com/api/health
# Expected: {"status":"healthy","database":"connected",...}

# 2. Admin Health (requires token)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://api.smokava.com/api/admin/health
# Expected: {"status":"healthy","dataAccess":{...}}

# 3. Check Services
docker compose ps
# All services should be "Up"
```

## ✅ Feature Verification

### 1. Role Management
- [ ] Login to admin panel
- [ ] Go to Users page
- [ ] Open a user's details
- [ ] Test assigning "admin" role
- [ ] Test assigning "operator" role with restaurant
- [ ] Test revoking a role
- [ ] Verify role changes persist

### 2. Moderation System
- [ ] Go to Moderation page in admin panel
- [ ] View list of posts
- [ ] Test hiding a post (toggle visibility)
- [ ] Test deleting a post
- [ ] Test deleting a comment
- [ ] Verify moderation logs are created

### 3. Time-Windowed Packages
- [ ] Go to Package Management in admin panel
- [ ] Create or edit a package
- [ ] Set startDate and endDate
- [ ] Add time windows (e.g., 13:00-17:00)
- [ ] Save package
- [ ] Test redeeming package outside time window
- [ ] Verify Persian error: "این بسته در این ساعت فعال نیست"

### 4. Counter Fixes
- [ ] Go to a user's profile in admin panel
- [ ] Check "رستوران‌های بازدید شده" count
- [ ] Check "قلیون‌های مصرف شده" count
- [ ] Verify counts match history logs
- [ ] Test in user profile page (frontend)
- [ ] Verify counters are accurate

### 5. PWA Install Prompt
- [ ] Open frontend in mobile browser
- [ ] Verify "Add to Home Screen" prompt appears
- [ ] Test dismissing prompt
- [ ] Verify prompt doesn't show again after dismissal
- [ ] Check localStorage for 'pwa-install-dismissed'

### 6. Public Profile Share
- [ ] Login to frontend
- [ ] Go to Profile page
- [ ] Click "اشتراک‌گذاری" (Share) button
- [ ] Test Web Share API (if available)
- [ ] Test clipboard fallback
- [ ] Verify "کپی شد!" confirmation appears
- [ ] Test shared URL in incognito/private window

### 7. Health Endpoints
- [ ] Test `/api/health` endpoint
- [ ] Test `/api/admin/health` endpoint (with auth)
- [ ] Verify database connection status
- [ ] Verify backup timestamp (if available)

## 🐛 Common Issues & Fixes

### Issue: Services not starting
```bash
# Check logs
docker compose logs backend
docker compose logs frontend
docker compose logs admin-panel

# Restart specific service
docker compose restart backend
```

### Issue: Database connection errors
```bash
# Check MongoDB
docker compose ps mongodb
docker compose logs mongodb

# Test connection
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Issue: Admin panel not loading users/packages
```bash
# Check API URL
# Verify VITE_API_URL is set correctly in admin-panel/.env
# Check browser console for errors
# Verify admin token is valid
```

### Issue: Time windows not working
```bash
# Check package has timeWindows array
# Verify timezone is Asia/Tehran
# Check server time matches timezone
# Test with current time in allowed window
```

## 📊 Performance Checks

- [ ] API response times < 500ms
- [ ] Frontend loads < 3 seconds
- [ ] Admin panel loads < 2 seconds
- [ ] Database queries optimized
- [ ] No memory leaks in logs

## 🔐 Security Checks

- [ ] All endpoints require authentication
- [ ] Admin endpoints require admin role
- [ ] CORS properly configured
- [ ] No sensitive data in logs
- [ ] Environment variables secured

## 📝 Logs to Monitor

```bash
# Backend logs
docker compose logs -f backend

# Frontend logs (if any)
docker compose logs -f frontend

# Admin panel logs
docker compose logs -f admin-panel

# MongoDB logs
docker compose logs -f mongodb
```

## 🎯 Success Criteria

All features should:
- ✅ Load without errors
- ✅ Function as expected
- ✅ Display correct data
- ✅ Handle errors gracefully
- ✅ Show Persian messages where applicable
- ✅ Maintain data integrity

## 📞 If Issues Found

1. Check deployment logs: `/var/log/smokava-deploy.log`
2. Check backup was created: `ls -lh /var/backups/smokava/`
3. Review error messages in browser console
4. Check API responses in Network tab
5. Verify environment variables
6. Restore from backup if needed

---

**After verification, mark all items as complete!**
