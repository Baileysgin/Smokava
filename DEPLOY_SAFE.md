# Safe Deployment Guide - Smokava

**CRITICAL**: This guide ensures database persistence and prevents data loss during deployment.

## 🚨 Critical Rules

### NEVER DO THESE:

1. **NEVER run**: `docker compose down -v` or `docker-compose down -v`
   - This **DELETES** all database volumes and **DESTROYS ALL DATA**
   - The deploy-safe.sh script will **ABORT** if it detects this

2. **NEVER run**: `docker compose down` without checking volumes first
   - Always use `docker compose up -d --no-deps` instead

3. **NEVER skip backups** before deployment
   - Always run `scripts/db-backup.sh` first

### ALWAYS DO THESE:

1. **ALWAYS backup** before deployment
2. **ALWAYS use** `scripts/deploy-safe.sh` for deployments
3. **ALWAYS verify** volumes exist before deployment
4. **ALWAYS check** database after deployment

## 📋 Pre-Deployment Checklist

- [ ] Database backup created (`scripts/db-backup.sh`)
- [ ] Backup verified (check `/var/backups/smokava/`)
- [ ] Health check passed (`scripts/pre-deploy-health-check.sh`)
- [ ] Volumes verified (`docker volume ls | grep mongodb`)
- [ ] Code committed and pushed to git
- [ ] Environment variables updated

## 🚀 Safe Deployment Process

### Method 1: Using deploy-safe.sh (Recommended)

```bash
cd /opt/smokava
sudo bash scripts/deploy-safe.sh
```

This script:
1. ✅ Creates pre-deploy backup
2. ✅ Runs health checks
3. ✅ Pulls latest code
4. ✅ Builds images
5. ✅ Starts services (preserves volumes)
6. ✅ Verifies database integrity

### Method 2: Manual Deployment

```bash
# 1. Backup
cd /opt/smokava
bash scripts/db-backup.sh

# 2. Pull code
git pull origin main

# 3. Build (optional, if code changed)
docker compose build --no-cache

# 4. Start services (CRITICAL: use --no-deps to preserve volumes)
docker compose up -d --no-deps --build backend frontend admin-panel

# 5. Verify
docker compose ps
curl https://api.smokava.com/api/health
```

## 🔒 Volume Protection

### Named Volumes Configuration

The `docker-compose.yml` uses **named volumes**:

```yaml
volumes:
  mongodb_data:
    name: smokava_mongodb_data  # Named volume - persists data
    driver: local
```

### Verify Volumes Exist

```bash
# List all volumes
docker volume ls

# Should see:
# smokava_mongodb_data
# smokava_admin_data

# Inspect volume
docker volume inspect smokava_mongodb_data
```

### Volume Safety Checks

The `deploy-safe.sh` script includes:
- ✅ Pre-deployment volume verification
- ✅ Prevention of `down -v` commands
- ✅ Warning if volumes are missing
- ✅ Database integrity check after deployment

## 🔐 SSH Key-Based Access

### Current Setup

If using password authentication, **migrate to SSH keys**:

### Step 1: Generate SSH Key (on your machine)

```bash
ssh-keygen -t ed25519 -C "smokava-deploy" -f ~/.ssh/smokava_deploy
```

### Step 2: Copy Public Key to Server

```bash
ssh-copy-id -i ~/.ssh/smokava_deploy.pub root@91.107.241.245
```

### Step 3: Test Connection

```bash
ssh -i ~/.ssh/smokava_deploy root@91.107.241.245 "echo 'SSH key works'"
```

### Step 4: Update GitHub Secrets

1. Go to: https://github.com/Baileysgin/Smokava/settings/secrets/actions
2. Add/Update: `SSH_PRIVATE_KEY` with private key content
3. Add/Update: `SSH_HOST` with `root@91.107.241.245`

### Step 5: Disable Password Authentication (Optional)

**⚠️ Only do this after SSH key is working!**

```bash
# On server
sudo nano /etc/ssh/sshd_config

# Set:
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

## 📦 Backup System

### Automatic Backups

Backups run **hourly** via cron or systemd timer.

#### Setup Cron (Recommended)

```bash
sudo bash scripts/setup-hourly-backup.sh
```

#### Setup Systemd Timer (Alternative)

```bash
sudo bash scripts/setup-backup-systemd.sh
```

### Manual Backup

```bash
bash scripts/db-backup.sh
```

### Backup Location

- **Path**: `/var/backups/smokava/`
- **Format**: `smokava_backup_YYYYMMDD_HHMMSS.gz`
- **Retention**: 168 backups (7 days of hourly backups)
- **Log**: `/var/log/smokava-backup.log`

### Verify Backups

```bash
# List backups
ls -lh /var/backups/smokava/

# Check last backup
cat /var/backups/smokava/last_backup.txt

# View backup logs
tail -f /var/log/smokava-backup.log
```

## 🔄 Restore from Backup

### Emergency Restore

```bash
# Find latest backup
LATEST=$(ls -t /var/backups/smokava/smokava_backup_*.gz | head -1)

# Restore
bash scripts/restore-database.sh "$LATEST"
```

### Verify Restore

```bash
# Check user count
docker compose exec mongodb mongosh --eval "db.users.countDocuments()" smokava

# Check packages
docker compose exec mongodb mongosh --eval "db.userpackages.countDocuments()" smokava
```

## 🏥 Health Checks

### Pre-Deployment

```bash
bash scripts/pre-deploy-health-check.sh
```

### Post-Deployment

```bash
# API health
curl https://api.smokava.com/api/health

# Admin health (requires token)
curl -H "Authorization: Bearer TOKEN" https://api.smokava.com/api/admin/health

# Backup status
curl -H "Authorization: Bearer TOKEN" https://api.smokava.com/api/admin/backups
```

## 🚫 Preventing Accidental Data Loss

### deploy-safe.sh Safety Features

1. **Volume Check**: Verifies volumes exist before deployment
2. **Command Blocking**: Prevents `down -v` commands
3. **Backup Requirement**: Creates backup before deployment
4. **Database Verification**: Checks database after deployment

### Additional Protections

1. **Read-only mode**: Make backup directory read-only for non-root users
2. **Volume backups**: Periodically backup volumes themselves
3. **Monitoring**: Alert if database becomes empty

## 📊 Monitoring

### Check Backup Status

```bash
# Via API
curl -H "Authorization: Bearer TOKEN" https://api.smokava.com/api/admin/backups

# Via command line
ls -lh /var/backups/smokava/
cat /var/backups/smokava/last_backup.txt
```

### Check Volume Status

```bash
docker volume ls
docker volume inspect smokava_mongodb_data
```

### Check Database Status

```bash
docker compose exec mongodb mongosh --eval "db.stats()" smokava
docker compose exec mongodb mongosh --eval "db.users.countDocuments()" smokava
```

## 🔧 Troubleshooting

### Issue: Volumes Missing

```bash
# Check if volumes exist
docker volume ls | grep mongodb

# If missing, check docker-compose.yml
# Volumes should be named, not anonymous
```

### Issue: Backup Fails

```bash
# Check backup script permissions
chmod +x scripts/db-backup.sh

# Check backup directory
mkdir -p /var/backups/smokava
chmod 755 /var/backups/smokava

# Test backup manually
bash scripts/db-backup.sh
```

### Issue: Database Empty After Deployment

```bash
# 1. Check if volume was removed
docker volume ls | grep mongodb

# 2. Check deployment logs
cat /var/log/smokava-deploy.log

# 3. Restore from backup
bash scripts/restore-database.sh /var/backups/smokava/smokava_backup_LATEST.gz
```

## 📝 Best Practices

1. **Always backup** before any deployment
2. **Test deployments** in staging first
3. **Monitor backups** daily
4. **Verify volumes** before major changes
5. **Use deploy-safe.sh** for all deployments
6. **Document changes** in deployment logs
7. **Keep multiple backups** (retention policy)
8. **Test restore** periodically

## 🆘 Emergency Procedures

### If Database is Lost

1. **Stop services**: `docker compose stop`
2. **Find latest backup**: `ls -t /var/backups/smokava/ | head -1`
3. **Restore**: `bash scripts/restore-database.sh <backup-file>`
4. **Verify**: Check user/package counts
5. **Restart**: `docker compose up -d`

### If Volume is Deleted

1. **Check if backup exists**: `ls /var/backups/smokava/`
2. **Restore from backup**: Use restore script
3. **Recreate volume**: `docker volume create smokava_mongodb_data`
4. **Restore data**: Run restore script again

---

**Remember**: Data safety is paramount. When in doubt, backup first!

