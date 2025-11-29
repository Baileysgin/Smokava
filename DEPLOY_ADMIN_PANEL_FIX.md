# 🚀 Deploy Admin Panel React Fix

## Problem Fixed
- Downgraded React from 19.2.0 to 18.3.1 for Ant Design compatibility
- Fixed "Cannot read properties of undefined (reading 'createContext')" error

## Deployment Instructions

### Option 1: Using Git (Recommended)

If your server has the repository cloned:

```bash
# SSH into server
ssh root@91.107.241.245

# Navigate to project directory
cd /opt/smokava

# Pull latest changes
git pull origin main

# Navigate to admin-panel
cd admin-panel

# Rebuild the Docker container
cd ..
docker compose build --no-cache admin-panel

# Restart the admin-panel container
docker compose up -d admin-panel

# Verify it's running
docker compose ps admin-panel
```

### Option 2: Manual File Copy

If you need to manually copy files:

```bash
# On your local machine, create a package with the updated files
cd /Users/negar/Desktop/Smokava
tar -czf admin-panel-fix.tar.gz admin-panel/package.json admin-panel/package-lock.json

# Copy to server (you'll need to use your preferred method)
# scp admin-panel-fix.tar.gz root@91.107.241.245:/tmp/

# Then on the server:
ssh root@91.107.241.245
cd /opt/smokava
tar -xzf /tmp/admin-panel-fix.tar.gz
cd admin-panel
docker compose build --no-cache admin-panel
docker compose up -d admin-panel
```

### Option 3: Direct Server Edit

If you have direct server access:

```bash
# SSH into server
ssh root@91.107.241.245
cd /opt/smokava/admin-panel

# Edit package.json
nano package.json
# Change:
#   "react": "^18.2.0",
#   "react-dom": "^18.2.0",
# And in devDependencies:
#   "@types/react": "^18.2.0",
#   "@types/react-dom": "^18.2.0",

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# Go back to root and rebuild
cd ..
docker compose build --no-cache admin-panel
docker compose up -d admin-panel
```

## Verify Deployment

After deployment, check:

1. **Container is running:**
   ```bash
   docker compose ps admin-panel
   ```

2. **Check logs for errors:**
   ```bash
   docker compose logs admin-panel
   ```

3. **Test the admin panel:**
   - Visit: http://admin.smokava.com
   - Or: http://91.107.241.245:5173
   - Should load without the React createContext error

## Expected Result

✅ Admin panel loads successfully
✅ No blank white page
✅ No JavaScript errors in console
✅ Login page displays correctly

## Rollback (if needed)

If something goes wrong:

```bash
cd /opt/smokava
docker compose restart admin-panel
# Or rebuild from previous version
git checkout HEAD~1 admin-panel/package.json admin-panel/package-lock.json
docker compose build --no-cache admin-panel
docker compose up -d admin-panel
```

