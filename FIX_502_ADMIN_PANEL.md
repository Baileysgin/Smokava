# Fix 502 Bad Gateway for Admin Panel

## Quick Fix

Run this script on your server:

```bash
sudo bash /opt/smokava/scripts/fix-admin-panel-502.sh
```

Or if you're in the project directory:

```bash
sudo bash scripts/fix-admin-panel-502.sh
```

## Manual Steps

If the script doesn't work, follow these steps:

### 1. Check Docker Containers

```bash
cd /opt/smokava
docker compose ps
```

Make sure `smokava-admin-panel` is running and shows status "Up".

### 2. Check Admin Panel Container

```bash
# Check if container is running
docker ps | grep admin-panel

# Check container logs
docker compose logs admin-panel

# Restart if needed
docker compose restart admin-panel

# Or rebuild if there are issues
docker compose up -d --build admin-panel
```

### 3. Verify Port 5173 is Accessible

```bash
# Test if admin panel responds
curl -I http://localhost:5173

# Should return HTTP 200, 301, or 302
```

### 4. Check Nginx Configuration

```bash
# Test nginx config
sudo nginx -t

# Check if nginx config has correct proxy_pass
sudo grep -r "proxy_pass.*5173" /etc/nginx/sites-enabled/

# Reload nginx
sudo systemctl reload nginx
```

### 5. Verify Nginx Config for Admin Panel

The nginx config should have:

```nginx
server {
    listen 443 ssl http2;
    server_name admin.smokava.com;

    location / {
        proxy_pass http://localhost:5173;
        # ... other proxy settings
    }
}
```

## Common Issues

### Issue 1: Container Not Running

**Symptoms:** Container shows as "Exited" or not in the list

**Fix:**
```bash
docker compose up -d admin-panel
docker compose logs admin-panel  # Check for errors
```

### Issue 2: Port 5173 Not Accessible

**Symptoms:** `curl http://localhost:5173` fails

**Fix:**
```bash
# Check if port is in use
sudo netstat -tlnp | grep 5173

# Restart container
docker compose restart admin-panel

# Rebuild if needed
docker compose up -d --build admin-panel
```

### Issue 3: Nginx Config Wrong

**Symptoms:** Nginx can't connect to backend

**Fix:**
1. Check nginx config file location:
   ```bash
   ls -la /etc/nginx/sites-enabled/ | grep smokava
   ```

2. Verify proxy_pass points to `http://localhost:5173`

3. Test and reload:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Issue 4: Container Crashed

**Symptoms:** Container keeps restarting or exits immediately

**Fix:**
```bash
# Check logs
docker compose logs --tail=100 admin-panel

# Check for build errors
docker compose build admin-panel

# Restart with fresh build
docker compose up -d --force-recreate admin-panel
```

## Verify Fix

After running the fix, verify:

1. **Container is running:**
   ```bash
   docker compose ps | grep admin-panel
   ```

2. **Port 5173 responds:**
   ```bash
   curl -I http://localhost:5173
   ```

3. **Nginx can proxy:**
   ```bash
   curl -I https://admin.smokava.com
   ```

4. **Browser access:**
   - Open https://admin.smokava.com
   - Should load the admin panel login page

## Still Not Working?

1. **Check all services:**
   ```bash
   docker compose ps
   ```

2. **Check nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Check admin panel logs:**
   ```bash
   docker compose logs -f admin-panel
   ```

4. **Check system resources:**
   ```bash
   docker stats
   free -h
   df -h
   ```

## Emergency Restart

If nothing works, restart everything:

```bash
cd /opt/smokava

# Restart all services (preserves database)
docker compose restart

# Wait a moment
sleep 10

# Check status
docker compose ps

# Reload nginx
sudo systemctl reload nginx
```

## Contact

If the issue persists, check:
- Docker logs: `docker compose logs`
- Nginx logs: `/var/log/nginx/error.log`
- System logs: `journalctl -u docker` or `journalctl -u nginx`
