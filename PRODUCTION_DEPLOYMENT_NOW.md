# Production Deployment - Ready to Execute

**Status**: ✅ All changes committed and pushed to GitHub
**Commit**: `c379105` - Complete implementation
**Branch**: `main`

## 🚀 Deployment Steps

### Step 1: Connect to Production Server

```bash
ssh root@91.107.241.245
# Or use your SSH key if configured
```

### Step 2: Navigate to Project Directory

```bash
cd /opt/smokava
```

### Step 3: Pull Latest Changes

```bash
git pull origin main
```

### Step 4: Run Safe Deployment

```bash
sudo bash scripts/deploy-safe.sh
```

This script will:
1. ✅ Create pre-deploy backup
2. ✅ Run health checks
3. ✅ Pull latest code
4. ✅ Build Docker images
5. ✅ Apply migrations (if any)
6. ✅ Start services (preserving database)
7. ✅ Verify deployment

## 📋 What's Being Deployed

- ✅ Role management system
- ✅ Moderation endpoints and UI
- ✅ Time-windowed packages with Persian errors
- ✅ Counter fixes (restaurant count & shisha usage)
- ✅ Health check endpoints
- ✅ PWA install prompt improvements
- ✅ Public profile share button
- ✅ Package time windows UI in admin panel
- ✅ Safe deployment scripts
- ✅ Backup and restore scripts

## 🔍 Verify Deployment

After deployment, verify:

```bash
# Check API health
curl https://api.smokava.com/api/health

# Check admin health (requires token)
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.smokava.com/api/admin/health

# Check services
docker compose ps

# Check logs
docker compose logs backend --tail 50
docker compose logs frontend --tail 50
docker compose logs admin-panel --tail 50
```

## ⚠️ Important Notes

1. **Database Safety**: The deployment script preserves the database volume
2. **Backup**: A backup is created before deployment
3. **Rollback**: If something goes wrong, restore from backup:
   ```bash
   bash scripts/restore-database.sh /var/backups/smokava/smokava_backup_LATEST.gz
   ```

## 📞 If Deployment Fails

1. Check logs: `docker compose logs -f`
2. Verify environment variables in `.env`
3. Check database connection: `docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"`
4. Restore from backup if needed

## ✅ Expected Result

After successful deployment:
- All services running
- Health endpoints responding
- Admin panel accessible
- New features available:
  - Time windows in package management
  - Share button on profile page
  - Improved counters
  - Health monitoring

---

**Ready to deploy!** Run the commands above on your production server.
