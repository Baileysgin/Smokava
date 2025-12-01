# Database Recovery Guide - No Users Found

**Issue**: Admin panel shows "No data available" - Database has 0 users

## 🔍 Diagnosis

The database appears to be empty or reset. This can happen if:
1. Database volume was removed/recreated
2. Database was reset during deployment
3. Connection to wrong database
4. Data migration issue

## ✅ Quick Fixes

### Option 1: Check if this is Production vs Local

```bash
# Check which database you're connected to
docker compose exec mongodb mongosh --eval "db.getName()" smokava

# Check if production database has data
# (SSH to production server)
ssh root@91.107.241.245
docker compose exec mongodb mongosh --eval "db.users.countDocuments()" smokava
```

### Option 2: Restore from Backup

```bash
# List available backups
ls -lh /var/backups/smokava/

# Restore from latest backup
bash scripts/restore-database.sh /var/backups/smokava/smokava_backup_LATEST.gz
```

### Option 3: Check Database Connection

```bash
# Verify MongoDB is running
docker compose ps mongodb

# Check connection
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check database name
docker compose exec mongodb mongosh --eval "db.getName()"
```

### Option 4: Verify Environment Variables

```bash
# Check MONGODB_URI
docker compose exec backend printenv MONGODB_URI

# Should be: mongodb://mongodb:27017/smokava
```

## 🔧 Production Database Check

If this is happening on production:

1. **Check if database volume exists:**
   ```bash
   docker volume ls | grep mongodb
   ```

2. **Check if volume is mounted:**
   ```bash
   docker compose config | grep -A 5 volumes
   ```

3. **Verify data persistence:**
   ```bash
   docker compose exec mongodb mongosh --eval "db.stats()" smokava
   ```

## 🚨 Emergency Recovery

If database was accidentally wiped:

1. **Stop services:**
   ```bash
   docker compose stop
   ```

2. **Restore from backup:**
   ```bash
   bash scripts/restore-database.sh /var/backups/smokava/smokava_backup_LATEST.gz
   ```

3. **Restart services:**
   ```bash
   docker compose up -d
   ```

## 📋 Prevention

To prevent this in the future:

1. **Always use named volumes** (already configured)
2. **Never use `docker compose down -v`** (removes volumes)
3. **Always backup before deployment**
4. **Use `deploy-safe.sh`** which preserves volumes

## 🔍 Debugging Steps

1. Check database connection
2. Verify volume persistence
3. Check for recent backups
4. Verify environment variables
5. Check deployment logs

---

**If this is production**, immediately check backups and restore if needed!
