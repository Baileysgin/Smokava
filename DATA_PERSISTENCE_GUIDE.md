# 💾 Data Persistence Guide

## ✅ Current Configuration

Your MongoDB data **IS PERSISTENT** and will survive container restarts!

### MongoDB Volume Status

- **Volume Name**: `smokava_mongodb_data`
- **Storage Location**: `/var/lib/docker/volumes/smokava_mongodb_data/_data`
- **Volume Type**: Persistent Docker volume (survives container restarts)
- **Current Size**: ~327MB (as of Nov 29, 2025)
- **Status**: ✅ **Properly configured and mounted**

### Docker Compose Configuration

Your `docker-compose.yml` correctly configures persistent storage:

```yaml
services:
  mongodb:
    volumes:
      - mongodb_data:/data/db  # Persistent volume mount

volumes:
  mongodb_data:
    driver: local  # Local filesystem storage (persistent)
```

This means:
- ✅ Data persists when containers restart
- ✅ Data persists when containers are recreated
- ✅ Data survives server reboots
- ✅ Data is stored on the host filesystem, not in the container

## 🔒 Data Safety Measures

### 1. Seed Script Protection

The seed script (`backend/scripts/seed.js`) has been updated to be safer:

**Before**: Always deleted existing data
**After**: Only clears data if explicitly requested

```bash
# Safe: Only inserts if data doesn't exist
npm run seed

# Explicit: Clears existing data first (use with caution!)
CLEAR_DATA=true npm run seed
# or
npm run seed -- --clear
```

### 2. Automatic Backups

Use the backup script to create regular backups:

```bash
# Create a backup
./scripts/backup-mongodb.sh

# Backups are stored in: /opt/smokava/backups/
# Automatically keeps last 10 backups
```

### 3. Manual Backups

You can also manually backup the MongoDB data:

```bash
# SSH to server
ssh root@91.107.241.245

# Create backup
docker exec smokava-mongodb mongodump --archive --gzip --db=smokava > backup_$(date +%Y%m%d).gz

# Backup volume directly (advanced)
docker run --rm -v smokava_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-volume-$(date +%Y%m%d).tar.gz /data
```

## 🚨 Preventing Data Loss

### Common Causes of Data Loss (and how to prevent them)

1. **Accidental seed script execution**
   - ✅ Fixed: Seed script now requires explicit `--clear` flag
   - ✅ Protection: Won't delete data unless explicitly requested

2. **Volume deletion**
   - ⚠️  Never run: `docker volume rm smokava_mongodb_data`
   - ⚠️  Never run: `docker compose down -v` (the `-v` flag removes volumes)

3. **Container recreation without preserving volumes**
   - ✅ Safe: `docker compose restart mongodb` - preserves data
   - ✅ Safe: `docker compose up -d mongodb` - preserves data
   - ⚠️  Unsafe: Removing volume mount from docker-compose.yml

4. **Ephemeral storage (PaaS platforms)**
   - ✅ Not an issue: Your server uses persistent Docker volumes
   - ✅ Data is stored on host filesystem: `/var/lib/docker/volumes/`

## 📋 Regular Maintenance

### Daily Backup (Recommended)

Add to cron for automatic daily backups:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /opt/smokava/scripts/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1
```

### Check Data Persistence

Verify your data is persistent:

```bash
# Check volume exists
docker volume ls | grep mongodb

# Check volume is mounted
docker inspect smokava-mongodb | grep -A 10 Mounts

# Check data directory size
du -sh /var/lib/docker/volumes/smokava_mongodb_data/_data

# List database collections
docker exec smokava-mongodb mongosh smokava --eval "db.getCollectionNames()"
```

## 🔄 Restore from Backup

If you need to restore data from a backup:

```bash
# List available backups
ls -lh /opt/smokava/backups/

# Restore a backup
./scripts/restore-mongodb.sh mongodb_backup_20251129_120000.gz
```

## ✅ Verification Checklist

- [x] MongoDB volume is properly configured in docker-compose.yml
- [x] Volume exists on server: `smokava_mongodb_data`
- [x] Volume is mounted correctly in container
- [x] Data directory contains actual files (327MB)
- [x] Seed script updated to prevent accidental deletion
- [x] Backup script created
- [x] Restore script created

## 📊 Current Status

```
✅ MongoDB Container: Running
✅ Persistent Volume: Configured
✅ Data Storage: /var/lib/docker/volumes/smokava_mongodb_data/_data
✅ Current Size: ~327MB
✅ Last Backup: Not yet configured (use backup script)
✅ Seed Script: Safe (requires --clear flag)
```

## 🎯 Best Practices

1. **Always backup before major changes**
   ```bash
   ./scripts/backup-mongodb.sh
   ```

2. **Never use `docker compose down -v`** (removes volumes)
   ```bash
   # Safe
   docker compose restart

   # Unsafe (removes volumes)
   docker compose down -v
   ```

3. **Verify data persistence after deployments**
   ```bash
   docker exec smokava-mongodb mongosh smokava --eval "db.getCollectionNames()"
   ```

4. **Set up automated daily backups**
   - Add cron job (see above)
   - Or use a backup service

5. **Monitor disk space**
   ```bash
   df -h /var/lib/docker/volumes/
   ```

## 📝 Summary

**Your data IS persistent!**

- MongoDB uses a Docker volume stored on the host filesystem
- Data survives container restarts, recreations, and server reboots
- The only way to lose data is:
  1. Manually deleting the volume
  2. Running seed script with `--clear` flag
  3. Host filesystem failure (backup regularly!)

**To ensure data safety:**
1. ✅ Use the backup script regularly
2. ✅ Never run `docker compose down -v`
3. ✅ Be careful with seed script (now requires explicit flag)
4. ✅ Set up automated backups

---

**Last Updated**: 2025-11-29
**Status**: ✅ Data persistence verified and configured

