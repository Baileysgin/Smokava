# ⚠️ URGENT: Production Database Empty

**Issue**: Production database shows 0 users, 0 packages, 0 restaurants  
**URL**: admin.smokava.com  
**Status**: CRITICAL

## 🚨 Immediate Actions

### Step 1: Check Production Database

```bash
# SSH to production server
ssh root@91.107.241.245

# Check database
cd /opt/smokava
docker compose exec mongodb mongosh --eval "db.users.countDocuments()" smokava
docker compose exec mongodb mongosh --eval "db.userpackages.countDocuments()" smokava
docker compose exec mongodb mongosh --eval "db.restaurants.countDocuments()" smokava
```

### Step 2: Check Database Volume

```bash
# Verify volume exists
docker volume ls | grep mongodb

# Check volume mount
docker compose config | grep -A 10 volumes

# Should show: mongodb_data:/data/db
```

### Step 3: Check Backups

```bash
# List backups
ls -lh /var/backups/smokava/

# Check last backup
cat /var/backups/smokava/last_backup.txt
```

### Step 4: Restore from Backup (if available)

```bash
# Find latest backup
LATEST_BACKUP=$(ls -t /var/backups/smokava/smokava_backup_*.gz | head -1)

# Restore
bash scripts/restore-database.sh "$LATEST_BACKUP"
```

## 🔍 Root Cause Analysis

Possible causes:
1. **Volume removed**: `docker compose down -v` was run
2. **Database reset**: MongoDB container was recreated
3. **Wrong database**: Connection to wrong database
4. **Deployment issue**: Volume not properly mounted

## ✅ Prevention

1. **Never run**: `docker compose down -v` (removes volumes)
2. **Always use**: `docker compose up -d --no-deps` (preserves volumes)
3. **Always backup**: Before any deployment
4. **Use deploy-safe.sh**: Which preserves volumes

## 🔧 Quick Fix (If No Backup)

If no backup exists and this is production:

1. **Check if data exists in volume:**
   ```bash
   docker volume inspect smokava_mongodb_data
   ```

2. **Check MongoDB logs:**
   ```bash
   docker compose logs mongodb --tail 100
   ```

3. **Verify connection string:**
   ```bash
   docker compose exec backend printenv MONGODB_URI
   ```

## 📞 Next Steps

1. **Immediately check production server**
2. **Verify backups exist**
3. **Restore from backup if available**
4. **Investigate what caused the data loss**
5. **Update deployment process to prevent this**

---

**URGENT**: If this is production, restore from backup immediately!

