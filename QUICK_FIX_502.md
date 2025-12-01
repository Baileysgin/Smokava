# Quick Fix for 502 Bad Gateway - Admin Panel

## 🚀 Quick Fix (Run on Server)

SSH into your server and run:

```bash
sudo bash /opt/smokava/scripts/fix-502-deploy.sh
```

Or if you're already in the project directory:

```bash
sudo bash scripts/fix-502-deploy.sh
```

## What This Script Does

1. ✅ Checks current container status
2. ✅ Stops and removes the admin-panel container
3. ✅ Rebuilds the admin-panel container
4. ✅ Starts the container fresh
5. ✅ Waits for it to be ready
6. ✅ Tests if port 5173 is accessible
7. ✅ Checks and reloads nginx configuration
8. ✅ Provides status summary

## Manual Fix (If Script Doesn't Work)

```bash
cd /opt/smokava

# 1. Stop admin panel
docker compose stop admin-panel

# 2. Remove container
docker rm -f smokava-admin-panel

# 3. Rebuild and start
docker compose up -d --build admin-panel

# 4. Wait a moment
sleep 15

# 5. Check status
docker compose ps admin-panel

# 6. Test locally
curl -I http://localhost:5173

# 7. Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

## Verify Fix

After running the script:

1. **Wait 30 seconds** for everything to start
2. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Try accessing**: https://admin.smokava.com

## Still Not Working?

Check these:

```bash
# Check container logs
docker compose logs admin-panel

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Check if port is accessible
curl -v http://localhost:5173

# Check container status
docker compose ps
```

## Common Issues

### Issue: Container keeps restarting
```bash
# Check logs for errors
docker compose logs --tail=100 admin-panel

# Check if build succeeded
docker compose build admin-panel
```

### Issue: Port 5173 not accessible
```bash
# Check if port is in use
sudo netstat -tlnp | grep 5173

# Restart container
docker compose restart admin-panel
```

### Issue: Nginx can't connect
```bash
# Verify nginx config
sudo nginx -t

# Check nginx config has correct proxy_pass
sudo grep -r "5173" /etc/nginx/sites-enabled/
```

## Need Help?

If the issue persists, provide:
1. Output of: `docker compose ps`
2. Output of: `docker compose logs --tail=50 admin-panel`
3. Output of: `sudo tail -20 /var/log/nginx/error.log`
