# Smokava Deployment Guide

This guide covers safe deployment procedures that preserve database integrity.

## Prerequisites

- Docker and Docker Compose installed
- SSH access to production server
- Environment variables configured (see `ENV.md`)

## Safe Deployment Steps

### 1. Pre-Deployment Backup

**ALWAYS** create a backup before deploying:

```bash
# On production server
cd /opt/smokava
./scripts/db-backup.sh
```

Or manually:
```bash
mongodump --uri="$MONGODB_URI" --archive=/var/backups/smokava/pre-deploy-$(date +%Y%m%d_%H%M%S).gz --gzip
```

### 2. Pull Latest Code

```bash
cd /opt/smokava
git pull origin main
```

### 3. Run Database Migrations (Non-Destructive)

MongoDB schema changes are applied automatically on model load. However, if you need to run custom migrations:

```bash
# Connect to MongoDB and run migration scripts if needed
# Example: node scripts/migrate-role-system.js
```

### 4. Build and Deploy

```bash
# Build new images
docker-compose build

# Deploy without recreating volumes (CRITICAL)
docker-compose up -d --no-deps --build backend frontend admin-panel

# OR use the safe deploy script
./scripts/deploy.sh
```

**IMPORTANT**: Never run `docker-compose down` or `docker-compose rm` as this may remove volumes.

### 5. Verify Deployment

```bash
# Check health endpoint
curl http://localhost:5000/api/health

# Check services are running
docker-compose ps

# Check logs
docker-compose logs -f backend
```

## Database Volume Safety

The `mongodb_data` volume is defined in `docker-compose.yml`:

```yaml
volumes:
  mongodb_data:
    driver: local
```

This volume persists data even if containers are recreated. **Never remove this volume manually.**

## Restoring from Backup

### 1. Stop Services

```bash
docker-compose stop backend
```

### 2. Restore Backup

```bash
# Find backup file
ls -lh /var/backups/smokava/

# Restore (replace TIMESTAMP with actual backup timestamp)
mongorestore --uri="$MONGODB_URI" --archive=/var/backups/smokava/smokava_backup_TIMESTAMP.gz --gzip --drop
```

**WARNING**: `--drop` will delete existing data. Use with caution.

### 3. Restart Services

```bash
docker-compose start backend
```

## Automated Backups

Backups run hourly via cron:

```bash
# Add to crontab (crontab -e)
0 * * * * /opt/smokava/scripts/db-backup.sh >> /var/log/smokava-backup.log 2>&1
```

Backups are automatically rotated (keeps last 168 = 7 days of hourly backups).

## CI/CD Integration

### GitHub Actions Safe Deploy

The deploy workflow should:

1. **Never** run destructive DB commands
2. **Always** take a snapshot before deploying
3. Use `docker-compose up -d --no-deps --build` to avoid dropping volumes
4. Run health checks after deploy

Example workflow:

```yaml
- name: Pre-deploy backup
  run: |
    ssh user@server "cd /opt/smokava && ./scripts/db-backup.sh"

- name: Deploy
  run: |
    ssh user@server "cd /opt/smokava && git pull && docker-compose up -d --no-deps --build backend frontend admin-panel"

- name: Health check
  run: |
    curl -f http://api.smokava.com/api/health || exit 1
```

## Troubleshooting

### Database Connection Issues

```bash
# Check MongoDB container
docker-compose logs mongodb

# Check volume
docker volume inspect smokava_mongodb_data

# Verify connection
docker-compose exec backend node -e "require('./server.js')"
```

### Backup Issues

```bash
# Check backup script permissions
chmod +x scripts/db-backup.sh

# Test backup manually
./scripts/db-backup.sh

# Check backup directory
ls -lh /var/backups/smokava/
```

### Rollback Procedure

1. Stop services: `docker-compose stop`
2. Restore from backup (see above)
3. Checkout previous commit: `git checkout <previous-commit>`
4. Rebuild and restart: `docker-compose up -d --build`

## Best Practices

1. **Always backup before deploying**
2. **Test migrations in staging first**
3. **Use feature flags for risky changes**
4. **Monitor health endpoint after deploy**
5. **Keep deployment logs**
6. **Never drop database volumes**
7. **Use blue-green deployment for zero downtime (optional)**
