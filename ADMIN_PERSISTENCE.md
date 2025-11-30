# Admin User Persistence

## ✅ Admin User Protection

The admin user is now fully protected and persistent:

### Protection Features:

1. **Model-Level Protection**
   - Admin users cannot be deleted via Mongoose methods
   - Pre-remove hooks prevent deletion
   - Error thrown if deletion attempted

2. **Docker Volume Persistence**
   - Admin credentials stored in Docker volume: `/app/data/admin-credentials.json`
   - Volume persists across container restarts and deployments
   - Credentials automatically restored on startup

3. **Auto-Creation on Startup**
   - Server automatically ensures admin user exists on startup
   - If admin missing, creates from volume or defaults
   - No manual intervention needed

### Default Credentials:

- **Username:** `admin`
- **Password:** `admin123`

**⚠️ Change the password after first login!**

### How It Works:

1. **On Server Startup:**
   - Server connects to MongoDB
   - Checks if admin user exists
   - If missing, creates admin from volume credentials or defaults
   - Saves credentials to volume for future use

2. **On Container Restart:**
   - Docker volume persists
   - Credentials loaded from volume
   - Admin user restored if database was reset

3. **On Deployment:**
   - Volume persists across deployments
   - Admin credentials maintained
   - No need to recreate admin user

### Volume Location:

- **In Container:** `/app/data/admin-credentials.json`
- **Docker Volume:** `admin_data` (persistent)

### Manual Admin Creation:

If you need to create/update admin manually:

```bash
docker-compose exec backend node scripts/createAdmin.js username password
```

This will:
- Create/update admin in database
- Save credentials to volume
- Protect admin from deletion

### Security Notes:

- ✅ Admin credentials stored in Docker volume (not in git)
- ✅ Admin user cannot be deleted
- ✅ Credentials persist across deployments
- ⚠️ Change default password after first login
- ⚠️ Volume should be backed up with database

### Backup:

The admin credentials volume should be included in backups:

```bash
# Backup admin credentials
docker run --rm -v smokava_admin_data:/data -v $(pwd):/backup alpine tar czf /backup/admin-data-backup.tar.gz /data
```

### Troubleshooting:

**Admin user missing:**
- Check server logs for admin creation messages
- Verify volume is mounted: `docker volume inspect smokava_admin_data`
- Manually create: `docker-compose exec backend node scripts/createAdmin.js admin admin123`

**Can't login:**
- Verify admin exists: Check MongoDB
- Check credentials in volume: `docker-compose exec backend cat /app/data/admin-credentials.json`
- Reset password: `docker-compose exec backend node scripts/createAdmin.js admin newpassword`
