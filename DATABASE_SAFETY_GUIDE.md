# Database Safety and Backup Guide

## Overview
This guide covers database safety features, backup procedures, and data recovery strategies for the Smokava MongoDB database.

## Table of Contents
1. [Database Safety Features](#database-safety-features)
2. [Backup Strategy](#backup-strategy)
3. [Automated Backups](#automated-backups)
4. [Manual Backup Procedures](#manual-backup-procedures)
5. [Restore Procedures](#restore-procedures)
6. [Data Validation](#data-validation)
7. [Index Maintenance](#index-maintenance)
8. [Monitoring and Alerts](#monitoring-and-alerts)

## Database Safety Features

### 1. Data Validation
- All models use Mongoose schemas with validation
- Required fields are enforced at the schema level
- Enum values are validated for fields like `status`, `role`, `badge`
- String lengths are limited (e.g., `bio` max 200 characters)

### 2. Transaction Safety
- Package purchases create `Transaction` records
- Restaurant payments are tracked in `RestaurantPayment` model
- Settlements create `Settlement` documents for audit trail
- All financial operations are logged and traceable

### 3. Referential Integrity
- Foreign key references use `ObjectId` types with `ref` definitions
- Cascade deletion is handled carefully (e.g., admin deletion prevention)
- Soft deletes are used where appropriate (e.g., `deletedAt` fields in Posts)

### 4. Data Consistency
- `UserPackage.history` is the authoritative source for consumption tracking
- `remainingCount` is calculated from `totalCount` minus consumed items
- Restaurant allocations are synchronized for bundle packages

### 5. Indexes
Critical indexes are defined for performance and data integrity:
- Unique indexes on `phoneNumber`, `username`, `telegramId` in User model
- Compound indexes on `userId` + `purchasedAt` for queries
- Indexes on `restaurant`, `status`, `createdAt` for RestaurantPayment

## Backup Strategy

### Backup Types

1. **Full Database Backup**
   - Complete MongoDB dump
   - Includes all collections and indexes
   - Recommended: Daily

2. **Incremental Backup**
   - Only changed data since last backup
   - Faster but more complex to restore
   - Recommended: Every 6 hours

3. **Collection-Level Backup**
   - Backup specific collections only
   - Useful for large databases
   - Can be done on-demand

### Backup Retention Policy

- **Daily backups**: Keep for 30 days
- **Weekly backups**: Keep for 12 weeks
- **Monthly backups**: Keep for 12 months
- **Critical operation backups**: Keep indefinitely

## Automated Backups

### Using MongoDB Tools (mongodump)

Create a backup script (`scripts/backup-database.sh`):

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/smokava"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"
RETENTION_DAYS=30

# Create backup directory
mkdir -p ${BACKUP_PATH}

# MongoDB connection string
MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017/smokava}"

# Perform backup
mongodump --uri="${MONGO_URI}" --out="${BACKUP_PATH}"

# Compress backup
tar -czf "${BACKUP_PATH}.tar.gz" -C "${BACKUP_DIR}" "${TIMESTAMP}"
rm -rf "${BACKUP_PATH}"

# Remove old backups
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed: ${BACKUP_PATH}.tar.gz"
```

### Using Cron for Scheduling

Add to crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh

# Incremental backup every 6 hours
0 */6 * * * /path/to/scripts/backup-incremental.sh
```

### Docker Compose Backup

If using Docker, add to `docker-compose.yml`:

```yaml
services:
  mongodb-backup:
    image: mongo:latest
    volumes:
      - ./backups:/backups
      - mongodb_data:/data/db:ro
    command: >
      bash -c "
        mongodump --host mongodb --out /backups/$(date +%Y%m%d_%H%M%S) &&
        tar -czf /backups/backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /backups $(date +%Y%m%d_%H%M%S) &&
        rm -rf /backups/$(date +%Y%m%d_%H%M%S)
      "
    depends_on:
      - mongodb
    restart: "no"
```

## Manual Backup Procedures

### Full Database Backup

```bash
# Using mongodump
mongodump --uri="mongodb://localhost:27017/smokava" --out=/backup/path

# Using Docker
docker exec mongodb_container mongodump --out=/data/backup
docker cp mongodb_container:/data/backup ./backup
```

### Specific Collection Backup

```bash
# Backup specific collection
mongodump --uri="mongodb://localhost:27017/smokava" \
  --collection=users \
  --out=/backup/path

# Backup multiple collections
mongodump --uri="mongodb://localhost:27017/smokava" \
  --collection=users \
  --collection=packages \
  --out=/backup/path
```

### Export to JSON

```bash
# Export collection to JSON
mongoexport --uri="mongodb://localhost:27017/smokava" \
  --collection=users \
  --out=/backup/users.json \
  --jsonArray
```

## Restore Procedures

### Full Database Restore

```bash
# From mongodump backup
mongorestore --uri="mongodb://localhost:27017/smokava" /backup/path

# From compressed backup
tar -xzf backup.tar.gz
mongorestore --uri="mongodb://localhost:27017/smokava" ./backup

# Drop existing collections before restore
mongorestore --uri="mongodb://localhost:27017/smokava" \
  --drop \
  /backup/path
```

### Selective Restore

```bash
# Restore specific collection
mongorestore --uri="mongodb://localhost:27017/smokava" \
  --collection=users \
  /backup/path/smokava/users.bson

# Restore from JSON
mongoimport --uri="mongodb://localhost:27017/smokava" \
  --collection=users \
  --file=/backup/users.json \
  --jsonArray
```

### Point-in-Time Recovery

For point-in-time recovery, you need MongoDB replica set with oplog:

```bash
# Restore to specific timestamp
mongorestore --uri="mongodb://localhost:27017/smokava" \
  --oplogReplay \
  --oplogLimit=1633021200 \
  /backup/path
```

## Data Validation

### Validate Database Integrity

```bash
# Validate all collections
mongo smokava --eval "db.getCollectionNames().forEach(function(c) { print(c + ': ' + db[c].validate().valid); })"

# Validate specific collection
db.users.validate({ full: true })
```

### Check Data Consistency

Run validation scripts:

```bash
# Check accounting system consistency
node scripts/verifyAccountingSystem.js

# Check package consistency
node scripts/validatePackages.js
```

## Index Maintenance

### Rebuild Indexes

```bash
# Rebuild all indexes
db.users.reIndex()
db.packages.reIndex()
db.userpackages.reIndex()

# Check index usage
db.users.aggregate([{ $indexStats: {} }])
```

### Monitor Index Performance

```javascript
// Check index usage
db.users.getIndexes()
db.users.aggregate([{ $indexStats: {} }])
```

## Monitoring and Alerts

### Health Checks

The admin panel includes a health check endpoint:
- GET `/api/admin/health`
- Checks database connection status
- Returns data access status

### Backup Verification

Create a script to verify backups:

```bash
#!/bin/bash
# Verify backup integrity
BACKUP_FILE=$1
TEMP_DIR=$(mktemp -d)

tar -xzf ${BACKUP_FILE} -C ${TEMP_DIR}

# Check if backup contains expected collections
REQUIRED_COLLECTIONS=("users" "packages" "userpackages" "transactions" "restaurantpayments")

for collection in "${REQUIRED_COLLECTIONS[@]}"; do
  if [ ! -f "${TEMP_DIR}/smokava/${collection}.bson" ]; then
    echo "ERROR: Missing collection ${collection}"
    rm -rf ${TEMP_DIR}
    exit 1
  fi
done

echo "Backup verification successful"
rm -rf ${TEMP_DIR}
```

### Automated Backup Testing

Test restore procedure regularly:

```bash
# Create test database from backup
mongorestore --uri="mongodb://localhost:27017/test_smokava" \
  --drop \
  /backup/path

# Run validation queries
mongo test_smokava --eval "db.users.count()"
```

## Best Practices

1. **Regular Backups**: Schedule automated daily backups
2. **Test Restores**: Periodically test restore procedures
3. **Offsite Storage**: Store backups in a separate location
4. **Encryption**: Encrypt sensitive backups
5. **Documentation**: Document all backup and restore procedures
6. **Monitoring**: Monitor backup success/failure
7. **Retention**: Follow retention policy strictly
8. **Validation**: Regularly validate data integrity

## Emergency Procedures

### Database Corruption

1. Stop the application
2. Restore from most recent backup
3. Verify data integrity
4. Resume operations

### Accidental Deletion

1. Stop write operations immediately
2. Identify last known good state
3. Restore affected collections from backup
4. Replay any operations since backup (if oplog available)

### Performance Issues

1. Check index usage
2. Rebuild indexes if needed
3. Analyze slow queries
4. Consider adding indexes for frequently queried fields

## Backup Locations

Default backup directory: `/var/backups/smokava`

Environment variable: `BACKUP_PATH` (if set)

## Contact

For database emergencies, contact the system administrator.
