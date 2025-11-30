# 💾 MongoDB Volume Configuration Guide

## ✅ Current Status

Your MongoDB data **IS ALREADY PERSISTENT**! The volume is configured and working.

### Volume Details
- **Volume Name**: `smokava_mongodb_data`
- **Type**: Docker named volume (persistent)
- **Location**: `/var/lib/docker/volumes/smokava_mongodb_data/_data`
- **Driver**: `local` (stored on host filesystem)
- **Status**: ✅ **Active and configured**

## 📋 Current Configuration

Your `docker-compose.yml` already has the correct configuration:

```yaml
services:
  mongodb:
    image: mongo:7
    volumes:
      - mongodb_data:/data/db  # ✅ Persistent volume

volumes:
  mongodb_data:
    driver: local  # ✅ Stored on host filesystem
```

## 🔒 How It Works

1. **Data Persistence**: MongoDB data is stored in a Docker volume on the host filesystem
2. **Container Independence**: Data survives container restarts, recreations, and updates
3. **Backend Updates**: Updating the backend container does NOT affect MongoDB data
4. **Volume Lifecycle**: Volume persists until explicitly deleted

## ✅ Safe Update Procedures

### Updating Backend (Safe - Data Preserved)

```bash
# Method 1: Restart only backend (safest)
docker compose restart backend

# Method 2: Rebuild and restart backend
docker compose stop backend
docker compose build backend
docker compose up -d backend

# Method 3: Full rebuild (still safe - MongoDB volume persists)
docker compose stop backend
docker compose build --no-cache backend
docker compose up -d backend
```

**✅ All of these methods preserve MongoDB data because:**
- MongoDB container is not affected
- MongoDB volume is not touched
- Only backend container is updated

### Updating MongoDB (Safe - Data Preserved)

```bash
# Update MongoDB image (data preserved)
docker compose stop mongodb
docker compose pull mongodb
docker compose up -d mongodb

# Or rebuild MongoDB container (data preserved)
docker compose stop mongodb
docker compose build mongodb
docker compose up -d mongodb
```

**✅ Data is preserved because the volume is not removed**

## ⚠️ Dangerous Operations (Data Loss Risk)

### ❌ NEVER Do These:

```bash
# ❌ Removes volumes - DATA LOSS!
docker compose down -v

# ❌ Removes specific volume - DATA LOSS!
docker volume rm smokava_mongodb_data

# ❌ Removes volume from docker-compose.yml - DATA LOSS!
# (If you remove the volume mount, data becomes inaccessible)
```

## 🔍 Verification Commands

### Check Volume Exists
```bash
docker volume ls | grep mongodb
```

### Check Volume Details
```bash
docker volume inspect smokava_mongodb_data
```

### Check Data Size
```bash
du -sh /var/lib/docker/volumes/smokava_mongodb_data/_data
```

### Verify Volume is Mounted
```bash
docker inspect smokava-mongodb | grep -A 10 Mounts
```

### Check Database Collections
```bash
docker exec smokava-mongodb mongosh smokava --eval "db.getCollectionNames()"
```

## 📦 Backup Before Updates (Recommended)

Even though data persists, it's good practice to backup before major updates:

```bash
# Create backup
./scripts/backup-mongodb.sh

# Or manually
docker exec smokava-mongodb mongodump --archive --gzip --db=smokava > backup_$(date +%Y%m%d_%H%M%S).gz
```

## 🔄 Complete Update Workflow (Safe)

```bash
# 1. Create backup (recommended)
./scripts/backup-mongodb.sh

# 2. Update backend code
git pull  # or copy new files

# 3. Rebuild backend (MongoDB unaffected)
docker compose stop backend
docker compose build backend
docker compose up -d backend

# 4. Verify MongoDB still running
docker ps | grep mongodb

# 5. Verify data still exists
docker exec smokava-mongodb mongosh smokava --eval "db.getCollectionNames()"
```

## 📊 Volume Management

### List All Volumes
```bash
docker volume ls
```

### Inspect Volume
```bash
docker volume inspect smokava_mongodb_data
```

### Backup Volume (Advanced)
```bash
# Backup entire volume
docker run --rm \
  -v smokava_mongodb_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mongodb-volume-$(date +%Y%m%d).tar.gz /data
```

### Restore Volume (Advanced)
```bash
# Restore from backup
docker run --rm \
  -v smokava_mongodb_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mongodb-volume-YYYYMMDD.tar.gz -C /
```

## 🎯 Summary

### ✅ What's Protected
- ✅ Backend container updates
- ✅ Backend code changes
- ✅ Backend image rebuilds
- ✅ MongoDB container restarts
- ✅ MongoDB image updates
- ✅ Server reboots
- ✅ Docker daemon restarts

### ⚠️ What's NOT Protected
- ❌ Volume deletion (`docker volume rm`)
- ❌ Using `docker compose down -v`
- ❌ Removing volume mount from docker-compose.yml
- ❌ Host filesystem failure
- ❌ Disk corruption

### 🛡️ Best Practices

1. **Always backup before major changes**
   ```bash
   ./scripts/backup-mongodb.sh
   ```

2. **Never use `-v` flag with docker compose down**
   ```bash
   # ✅ Safe
   docker compose down

   # ❌ Dangerous
   docker compose down -v
   ```

3. **Verify volume exists before updates**
   ```bash
   docker volume ls | grep mongodb
   ```

4. **Monitor disk space**
   ```bash
   df -h /var/lib/docker/volumes/
   ```

5. **Set up automated backups**
   ```bash
   # Add to crontab
   0 2 * * * /opt/smokava/scripts/backup-mongodb.sh
   ```

## 📝 Current Configuration Status

```
✅ Volume Name: smokava_mongodb_data
✅ Volume Type: Named Docker volume
✅ Storage Location: /var/lib/docker/volumes/smokava_mongodb_data/_data
✅ Driver: local (host filesystem)
✅ Status: Active and mounted
✅ Data Persistence: Guaranteed
```

## 🚀 Quick Reference

```bash
# Safe backend update
docker compose restart backend

# Safe backend rebuild
docker compose stop backend && docker compose build backend && docker compose up -d backend

# Check volume
docker volume inspect smokava_mongodb_data

# Backup data
./scripts/backup-mongodb.sh

# Verify data
docker exec smokava-mongodb mongosh smokava --eval "db.getCollectionNames()"
```

---

**Status**: ✅ **MongoDB volume is properly configured and data is persistent!**

**Last Updated**: 2025-11-29

