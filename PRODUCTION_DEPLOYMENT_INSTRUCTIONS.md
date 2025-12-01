# Production Deployment Instructions - DB Persistence System

**Date**: December 1, 2024  
**Status**: Ready for Production  
**Priority**: CRITICAL - Database Safety

## 🚀 Immediate Actions Required

### Step 1: Pull Latest Changes

```bash
# SSH to production server
ssh root@91.107.241.245

# Navigate to project
cd /opt/smokava

# Pull latest code
git pull origin main
```

### Step 2: Setup Hourly Backups

```bash
# Setup automatic hourly backups (choose one method)

# Option A: Cron (Recommended)
sudo bash scripts/setup-hourly-backup.sh

# Option B: Systemd Timer
sudo bash scripts/setup-backup-systemd.sh
```

**Verify backup setup:**
```bash
# For cron
crontab -l | grep db-backup

# For systemd
systemctl status smokava-backup.timer
```

### Step 3: Verify Volumes

```bash
# Check volumes exist
docker volume ls | grep mongodb

# Should show:
# smokava_mongodb_data
# smokava_admin_data

# If volumes don't exist, they will be created on first deploy
```

### Step 4: Test Backup

```bash
# Create a test backup
bash scripts/db-backup.sh

# Verify backup was created
ls -lh /var/backups/smokava/

# Check last backup timestamp
cat /var/backups/smokava/last_backup.txt
```

### Step 5: Deploy Safely

```bash
# Use the safe deployment script
sudo bash scripts/deploy-safe.sh
```

This script will:
1. ✅ Create pre-deploy backup
2. ✅ Run health checks
3. ✅ Pull latest code
4. ✅ Build images
5. ✅ Start services (preserves volumes)
6. ✅ Verify database integrity

## 🔍 Post-Deployment Verification

### 1. Check Services

```bash
docker compose ps
# All services should be "Up"
```

### 2. Check Health Endpoints

```bash
# General health
curl https://api.smokava.com/api/health

# Admin health (requires token)
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.smokava.com/api/admin/health

# Backup status (requires token)
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.smokava.com/api/admin/backups
```

### 3. Verify Database

```bash
# Check user count
docker compose exec mongodb mongosh --eval "db.users.countDocuments()" smokava

# Check packages
docker compose exec mongodb mongosh --eval "db.userpackages.countDocuments()" smokava
```

### 4. Check Backups

```bash
# List backups
ls -lh /var/backups/smokava/

# Check backup count
ls -1 /var/backups/smokava/smokava_backup_*.gz | wc -l

# Should have at least 1 backup (from deployment)
```

## 📋 Verification Checklist

After deployment, verify:

- [ ] All services running (`docker compose ps`)
- [ ] Health endpoints responding
- [ ] Database has data (user count > 0)
- [ ] Backup was created during deployment
- [ ] Hourly backup cron/timer is active
- [ ] Volumes exist and persist
- [ ] Admin panel loads correctly
- [ ] Frontend loads correctly

## 🔒 Safety Reminders

**NEVER:**
- Run `docker compose down -v` (DELETES DATABASE)
- Skip backups before deployment
- Use anonymous volumes

**ALWAYS:**
- Use `deploy-safe.sh` for deployments
- Verify backups exist
- Check volumes before major changes
- Monitor backup status

## 🆘 If Something Goes Wrong

### Database Empty After Deployment

```bash
# 1. Check if volume exists
docker volume ls | grep mongodb

# 2. Check deployment logs
cat /var/log/smokava-deploy.log

# 3. Restore from backup
LATEST=$(ls -t /var/backups/smokava/smokava_backup_*.gz | head -1)
bash scripts/restore-database.sh "$LATEST"
```

### Backup Not Working

```bash
# 1. Check script permissions
chmod +x scripts/db-backup.sh

# 2. Check backup directory
mkdir -p /var/backups/smokava
chmod 755 /var/backups/smokava

# 3. Test backup manually
bash scripts/db-backup.sh

# 4. Check logs
tail -f /var/log/smokava-backup.log
```

### Volume Missing

```bash
# 1. Check docker-compose.yml
cat docker-compose.yml | grep -A 5 volumes

# 2. Recreate volume (if needed)
docker volume create smokava_mongodb_data

# 3. Restore from backup
bash scripts/restore-database.sh <backup-file>
```

## 📊 Monitoring

### Daily Checks

```bash
# Check backup status
curl -H "Authorization: Bearer TOKEN" https://api.smokava.com/api/admin/backups

# Check service status
docker compose ps

# Check disk space
df -h /var/backups
```

### Weekly Checks

```bash
# Verify backup rotation
ls -1 /var/backups/smokava/smokava_backup_*.gz | wc -l
# Should be <= 168 (7 days * 24 hours)

# Test restore (on staging/test)
# (Don't test restore on production unless needed)
```

## 📞 Support

If issues occur:
1. Check `DEPLOY_SAFE.md` for detailed procedures
2. Review `DB_PERSISTENCE_VERIFICATION_REPORT.md`
3. Check backup status via API
4. Review deployment logs

---

**Ready to deploy!** Follow the steps above on your production server.

