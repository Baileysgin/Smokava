# Backup and Restore Guide for Smokava

**CRITICAL**: This guide ensures database backups and safe restore procedures.

This guide covers database backup and restore procedures for MongoDB.

## Backup Configuration

Backups are configured to run hourly via cron:

```bash
# Add to crontab
0 * * * * /opt/smokava/scripts/db-backup.sh >> /var/log/smokava-backup.log 2>&1
```

### Environment Variables

Set in `.env`:

```bash
BACKUP_PATH=/var/backups/smokava
RETENTION_DAYS=7
RETENTION_HOURS=168  # 7 days * 24 hours
MONGODB_URI=mongodb://mongodb:27017/smokava
DB_NAME=smokava
```

## Manual Backup

### Using Backup Script

```bash
cd /opt/smokava
bash scripts/db-backup.sh
```

### Direct MongoDB Backup

#### Local MongoDB (Docker)

```bash
# Backup
docker compose exec mongodb mongodump --archive=/tmp/backup.gz --gzip
docker cp smokava-mongodb:/tmp/backup.gz /var/backups/smokava/backup_$(date +%Y%m%d_%H%M%S).gz

# Or using mongodump from host
mongodump --host=localhost --port=27017 --db=smokava --archive=/var/backups/smokava/backup.gz --gzip
```

#### MongoDB Atlas

```bash
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/smokava" \
  --archive=/var/backups/smokava/backup.gz --gzip
```

## Restore Procedure

### From Backup File

```bash
# Restore from backup
bash scripts/restore-database.sh /var/backups/smokava/smokava_backup_20240101_120000.gz
```

### Manual Restore

#### Local MongoDB (Docker)

```bash
# Copy backup to container
docker cp /var/backups/smokava/backup.gz smokava-mongodb:/tmp/backup.gz

# Restore
docker compose exec mongodb mongorestore --archive=/tmp/backup.gz --gzip --drop

# Or using mongorestore from host
mongorestore --host=localhost --port=27017 --archive=/var/backups/smokava/backup.gz --gzip --drop
```

#### MongoDB Atlas

```bash
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/smokava" \
  --archive=/var/backups/smokava/backup.gz --gzip --drop
```

## Backup Rotation

Backups are automatically rotated by the backup script:

- Keeps last 168 backups (7 days of hourly backups) by default
- Older backups are automatically deleted
- Configure via `RETENTION_HOURS` environment variable

### Manual Cleanup

```bash
# List backups
ls -lh /var/backups/smokava/smokava_backup_*.gz

# Remove backups older than 7 days
find /var/backups/smokava -name "smokava_backup_*.gz" -mtime +7 -delete
```

## Backup Verification

### Check Backup File

```bash
# List backup files
ls -lh /var/backups/smokava/

# Check backup size
du -h /var/backups/smokava/smokava_backup_*.gz

# Verify backup integrity (test restore to temp database)
mongorestore --archive=/var/backups/smokava/backup.gz --gzip --db=smokava_test
```

### Check Last Backup Time

```bash
# Read last backup timestamp
cat /var/backups/smokava/last_backup.txt

# Check backup log
tail -f /var/log/smokava-backup.log
```

## Backup Locations

- **Backup Directory**: `/var/backups/smokava/`
- **Log File**: `/var/log/smokava-backup.log`
- **Last Backup Timestamp**: `/var/backups/smokava/last_backup.txt`

## Restore Script

Create `scripts/restore-database.sh`:

```bash
#!/bin/bash

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Restoring from: $BACKUP_FILE"

# Determine docker compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "Error: docker compose not found"
    exit 1
fi

# Copy backup to container
MONGODB_CONTAINER=$($DOCKER_COMPOSE_CMD ps -q mongodb)
docker cp "$BACKUP_FILE" "$MONGODB_CONTAINER:/tmp/restore.gz"

# Restore
docker exec "$MONGODB_CONTAINER" mongorestore --archive=/tmp/restore.gz --gzip --drop

# Cleanup
docker exec "$MONGODB_CONTAINER" rm -f /tmp/restore.gz

echo "Restore completed"
```

Make executable:

```bash
chmod +x scripts/restore-database.sh
```

## Disaster Recovery

### Complete System Restore

1. **Stop services**:
```bash
docker compose stop
```

2. **Restore database**:
```bash
bash scripts/restore-database.sh /var/backups/smokava/smokava_backup_LATEST.gz
```

3. **Start services**:
```bash
docker compose up -d
```

4. **Verify**:
```bash
curl https://api.smokava.com/api/health
```

### Partial Restore (Specific Collections)

```bash
# Restore specific collection
mongorestore --archive=/var/backups/smokava/backup.gz --gzip \
  --db=smokava --collection=users
```

## Backup Best Practices

1. **Automate backups** - Use cron for hourly backups
2. **Test restores** - Regularly test restore procedure
3. **Off-site backups** - Copy backups to remote location
4. **Monitor backups** - Check backup logs regularly
5. **Version backups** - Keep multiple backup versions
6. **Encrypt backups** - For sensitive data
7. **Document restore** - Keep restore procedures documented

## Troubleshooting

### Backup Fails

```bash
# Check MongoDB connection
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check disk space
df -h /var/backups

# Check permissions
ls -la /var/backups/smokava/
```

### Restore Fails

```bash
# Check backup file integrity
file /var/backups/smokava/backup.gz

# Check MongoDB is running
docker compose ps mongodb

# Check MongoDB logs
docker compose logs mongodb
```

### Backup Script Not Running

```bash
# Check cron service
systemctl status cron

# Check crontab
crontab -l

# Check backup log
tail -f /var/log/smokava-backup.log
```

## Backup Retention Policy

- **Hourly backups**: Last 168 hours (7 days)
- **Daily backups**: Last 30 days (optional)
- **Weekly backups**: Last 12 weeks (optional)
- **Monthly backups**: Last 12 months (optional)

Configure retention via environment variables in `.env`.
