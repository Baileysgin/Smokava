# 🚀 Deploy 502 Fix - Production Server

## Quick Deploy (One Command)

SSH into your production server and run:

```bash
cd /opt/smokava && git pull && sudo bash scripts/fix-production-502.sh
```

## What This Does

1. ✅ Pulls latest code (including the port fix)
2. ✅ Fixes docker-compose.yml port mapping (5001→5000)
3. ✅ Restarts backend with correct port
4. ✅ Tests all services
5. ✅ Reloads nginx
6. ✅ Tests production URLs

## Manual Steps (If Script Doesn't Work)

```bash
# 1. SSH into server
ssh user@your-server

# 2. Navigate to project
cd /opt/smokava

# 3. Pull latest code
git pull

# 4. Fix port mapping
sed -i.bak 's/"5001:5000"/"5000:5000"/g' docker-compose.yml

# 5. Restart backend
docker compose stop backend
docker compose up -d backend

# 6. Wait for backend
sleep 15

# 7. Test backend
curl http://localhost:5000/api/health

# 8. Reload nginx
sudo nginx -t && sudo systemctl reload nginx

# 9. Test production
curl -I https://api.smokava.com/api/health
curl -I https://smokava.com
curl -I https://admin.smokava.com
```

## Verification

After deployment, verify:

- ✅ `https://api.smokava.com/api/health` returns 200
- ✅ `https://smokava.com` loads (not 502)
- ✅ `https://admin.smokava.com` loads (not 502)

## If Still Getting 502

1. Check container status: `docker compose ps`
2. Check backend logs: `docker compose logs backend`
3. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify port: `netstat -tlnp | grep 5000`

## Expected Results

- Backend container running on port 5000
- All production URLs return 200 (not 502)
- Services accessible via nginx proxy

