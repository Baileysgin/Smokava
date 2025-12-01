# Safe Deployment Guide for Smokava

This guide covers safe deployment practices to ensure database persistence and zero-downtime deployments.

## Overview

The deployment process uses `scripts/deploy-safe.sh` which:
1. Creates a pre-deploy backup
2. Runs health checks
3. Pulls latest code
4. Builds Docker images
5. Applies migrations (non-destructive)
6. Starts services without removing volumes
7. Verifies database integrity

## Prerequisites

- Docker and Docker Compose installed
- Git repository cloned to `/opt/smokava`
- MongoDB named volume configured in `docker-compose.yml`
- Backup script configured (`scripts/db-backup.sh`)

## Quick Deploy

```bash
cd /opt/smokava
sudo bash scripts/deploy-safe.sh
```

## Manual Deployment Steps

### 1. Pre-Deploy Backup

```bash
# Create backup before deployment
bash scripts/db-backup.sh
```

### 2. Health Check

```bash
# Verify services are healthy
bash scripts/pre-deploy-health-check.sh
```

### 3. Pull Latest Code

```bash
cd /opt/smokava
git fetch origin
git pull origin main  # or master
```

### 4. Build Images

```bash
docker compose build --no-cache
```

### 5. Apply Migrations (if any)

MongoDB doesn't use traditional migrations, but any setup scripts should be run:

```bash
docker compose exec backend node scripts/migrate.js
```

### 6. Start Services (Preserving Volumes)

**CRITICAL: Never use `docker compose down` as it removes volumes!**

```bash
# Start services without removing volumes
docker compose up -d --no-deps backend frontend admin-panel

# Or restart specific service
docker compose restart backend
```

### 7. Verify Deployment

```bash
# Check service status
docker compose ps

# Check logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f admin-panel

# Verify database
docker compose exec mongodb mongosh --eval "db.users.countDocuments()" smokava
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/smokava
            sudo bash scripts/deploy-safe.sh
```

## Important Notes

### Database Persistence

- **NEVER** use `docker compose down` in production
- **ALWAYS** use named volumes for MongoDB data
- **ALWAYS** backup before deployment
- Use `docker compose up -d --no-deps` to restart services

### Volume Configuration

Ensure `docker-compose.yml` has:

```yaml
volumes:
  mongodb_data:
    driver: local
```

### Environment Variables

All environment variables must be set in `.env` file:

```bash
# Required
MONGODB_URI=mongodb://mongodb:27017/smokava
JWT_SECRET=your-secret-key
API_BASE_URL=https://api.smokava.com
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com

# Backup
BACKUP_PATH=/var/backups/smokava
RETENTION_DAYS=7
```

### Rollback Procedure

If deployment fails:

1. Stop new containers:
```bash
docker compose stop backend frontend admin-panel
```

2. Restore from backup:
```bash
bash scripts/restore-database.sh /var/backups/smokava/smokava_backup_TIMESTAMP.gz
```

3. Restart with previous code:
```bash
git checkout <previous-commit>
docker compose up -d
```

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Check container status
docker compose ps

# Restart specific service
docker compose restart backend
```

### Database Connection Issues

```bash
# Verify MongoDB is running
docker compose ps mongodb

# Check MongoDB logs
docker compose logs mongodb

# Test connection
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Health Check Failures

```bash
# Manually test API
curl https://api.smokava.com/api/health

# Check admin health
curl -H "Authorization: Bearer TOKEN" https://api.smokava.com/api/admin/health
```

## Best Practices

1. **Always backup before deployment**
2. **Test in staging first**
3. **Use feature branches for major changes**
4. **Monitor logs during deployment**
5. **Have rollback plan ready**
6. **Never deploy on Fridays (unless critical)**
7. **Schedule deployments during low-traffic hours**

## Monitoring

After deployment, monitor:

- API health endpoint: `/api/health`
- Admin health endpoint: `/api/admin/health`
- Database connection status
- Service logs
- Error rates
- Response times
