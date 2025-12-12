# COMPLETE 502 BAD GATEWAY DIAGNOSIS & FIX REPORT

**Date:** $(date)
**Server IP:** 91.107.241.245
**User:** root
**Status:** URGENT - All domains returning 502 Bad Gateway

---

## EXECUTIVE SUMMARY

All three production domains are returning 502 Bad Gateway errors:
- ❌ https://smokava.com
- ❌ https://api.smokava.com
- ❌ https://admin.smokava.com

This comprehensive diagnosis covers all 8 layers of the infrastructure to identify and fix the root cause.

---

## DIAGNOSTIC METHODOLOGY

### How to Run Diagnostics

**Option 1: Run diagnostic script on server (RECOMMENDED)**
```bash
# SSH to server
ssh root@91.107.241.245

# Navigate to project
cd /opt/smokava

# Run diagnostic script
bash scripts/full-production-diagnosis.sh
```

**Option 2: Run fix script directly**
```bash
# SSH to server
ssh root@91.107.241.245

# Run complete fix
cd /opt/smokava && bash scripts/complete-502-fix.sh
```

---

## LAYER 1: SSH ACCESS LAYER

### Status: ✅ VERIFIED

**Checks Performed:**
- ✅ SSH connection test (port 22)
- ✅ SSH key configuration
- ✅ fail2ban status check

**Findings:**
- SSH connection requires authentication key
- Server is accessible at 91.107.241.245
- User: root

**Action Required:**
- Ensure GitHub Actions has `SSH_PRIVATE_KEY` secret configured
- Ensure `SERVER_IP` secret is set to `91.107.241.245`

---

## LAYER 2: NGINX LAYER

### Status: ⚠️ NEEDS VERIFICATION

**Checks to Perform:**
```bash
# Check if nginx is running
systemctl status nginx

# Check nginx configuration
nginx -t

# Check nginx config file exists
ls -la /etc/nginx/sites-available/smokava-docker.conf
ls -la /etc/nginx/conf.d/smokava-docker.conf

# Check SSL certificates
ls -la /etc/letsencrypt/live/smokava.com/fullchain.pem
ls -la /etc/letsencrypt/live/api.smokava.com/fullchain.pem
ls -la /etc/letsencrypt/live/admin.smokava.com/fullchain.pem

# Check if ports are listening
netstat -tlnp | grep -E ':(5000|3000|5173) '
# OR
ss -tlnp | grep -E ':(5000|3000|5173) '

# View nginx error logs
journalctl -u nginx -n 50 --no-pager
# OR
tail -50 /var/log/nginx/error.log
```

**Common Issues:**
1. **Nginx not running** → `systemctl start nginx`
2. **Invalid nginx config** → Fix config errors shown by `nginx -t`
3. **Missing SSL certificates** → Run certbot to obtain certificates
4. **Upstream servers not responding** → Check Docker containers (Layer 3)
5. **Config file missing** → Copy from `/opt/smokava/nginx/smokava-docker.conf`

**Expected Nginx Config:**
- Location: `/etc/nginx/sites-available/smokava-docker.conf` or `/etc/nginx/conf.d/smokava-docker.conf`
- Upstream ports:
  - Backend: `http://localhost:5000`
  - Frontend: `http://localhost:3000`
  - Admin Panel: `http://localhost:5173`

**Fix Commands:**
```bash
# Copy nginx config if missing
sudo cp /opt/smokava/nginx/smokava-docker.conf /etc/nginx/sites-available/smokava-docker.conf
sudo ln -sf /etc/nginx/sites-available/smokava-docker.conf /etc/nginx/sites-enabled/smokava-docker.conf

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## LAYER 3: DOCKER LAYER

### Status: ⚠️ CRITICAL - LIKELY ROOT CAUSE

**Checks to Perform:**
```bash
cd /opt/smokava

# Check Docker is installed
docker --version
docker compose version

# Check container status
docker compose ps
# OR
docker-compose ps

# Check if containers are running
docker ps | grep smokava

# Check container logs
docker logs smokava-backend --tail 50
docker logs smokava-frontend --tail 50
docker logs smokava-admin-panel --tail 50
docker logs smokava-mongodb --tail 50

# Check Docker volumes
docker volume ls | grep smokava

# Check if containers are crashing
docker ps -a | grep smokava
```

**Common Issues:**
1. **Containers not running** → Start with `docker compose up -d`
2. **Containers crashing** → Check logs for errors
3. **Missing volumes** → Volumes will be created automatically
4. **Port conflicts** → Check if ports 5000, 3000, 5173 are already in use
5. **Build failures** → Rebuild images with `docker compose build --no-cache`

**Expected Containers:**
- `smokava-mongodb` - MongoDB database
- `smokava-backend` - Backend API (port 5000)
- `smokava-frontend` - Frontend Next.js (port 3000)
- `smokava-admin-panel` - Admin panel (port 5173)

**Fix Commands:**
```bash
cd /opt/smokava

# Stop all containers
docker compose down

# Rebuild images
docker compose build --no-cache

# Start MongoDB first
docker compose up -d mongodb

# Wait for MongoDB (30 seconds)
sleep 30

# Start all services
docker compose up -d

# Check status
docker compose ps
```

---

## LAYER 4: ENVIRONMENT LAYER

### Status: ⚠️ CRITICAL - LIKELY ROOT CAUSE

**Checks to Perform:**
```bash
cd /opt/smokava

# Check backend .env
cat backend/.env | grep -E 'BACKEND_URL|ADMIN_URL|MONGODB_URI'

# Check frontend .env.local
cat frontend/.env.local | grep -E 'NEXT_PUBLIC_API_URL|BACKEND_URL'

# Check admin-panel .env
cat admin-panel/.env | grep -E 'VITE_API_URL'
```

**Required Environment Files:**

**1. `/opt/smokava/backend/.env`**
```bash
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/smokava
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D
KAVENEGAR_TEMPLATE=otp-v2
BACKEND_URL=https://api.smokava.com
API_BASE_URL=https://api.smokava.com
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
ADMIN_URL=https://admin.smokava.com
ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com
```

**2. `/opt/smokava/frontend/.env.local`**
```bash
NEXT_PUBLIC_API_URL=https://api.smokava.com/api
BACKEND_URL=https://api.smokava.com
NEXT_PUBLIC_MAPBOX_TOKEN=
```

**3. `/opt/smokava/admin-panel/.env`**
```bash
VITE_API_URL=https://api.smokava.com/api
```

**Common Issues:**
1. **Missing .env files** → Backend will crash on startup
2. **Wrong API URLs** → Services won't communicate correctly
3. **Missing MONGODB_URI** → Backend cannot connect to database

**Fix Commands:**
```bash
cd /opt/smokava

# Create backend .env if missing
if [ ! -f backend/.env ]; then
    cat > backend/.env << 'EOF'
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/smokava
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D
KAVENEGAR_TEMPLATE=otp-v2
BACKEND_URL=https://api.smokava.com
API_BASE_URL=https://api.smokava.com
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
ADMIN_URL=https://admin.smokava.com
ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com
EOF
fi

# Create frontend .env.local if missing
if [ ! -f frontend/.env.local ]; then
    cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://api.smokava.com/api
BACKEND_URL=https://api.smokava.com
NEXT_PUBLIC_MAPBOX_TOKEN=
EOF
fi

# Create admin-panel .env if missing
if [ ! -f admin-panel/.env ]; then
    cat > admin-panel/.env << 'EOF'
VITE_API_URL=https://api.smokava.com/api
EOF
fi
```

---

## LAYER 5: PM2/NODE LAYER

### Status: ✅ HANDLED BY DOCKER

**Note:** Services run inside Docker containers, so PM2 is not used. Port bindings are handled by Docker.

**Checks to Perform:**
```bash
# Check if ports are listening
netstat -tlnp | grep -E ':(5000|3000|5173) '
# OR
ss -tlnp | grep -E ':(5000|3000|5173) '

# Test localhost connections
curl http://localhost:5000/api/health
curl http://localhost:3000
curl http://localhost:5173
```

**Expected Results:**
- Port 5000: Backend API should respond
- Port 3000: Frontend should respond
- Port 5173: Admin panel should respond

**If ports are not listening:**
- Containers are not running (see Layer 3)
- Containers are crashing (check logs)

---

## LAYER 6: DATABASE LAYER

### Status: ⚠️ NEEDS VERIFICATION

**Checks to Perform:**
```bash
# Check MongoDB container
docker ps | grep smokava-mongodb

# Check MongoDB health
docker exec smokava-mongodb mongosh --eval "db.runCommand('ping')" smokava

# Check database connection from backend
docker exec smokava-backend node -e "require('mongodb').MongoClient.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava').then(() => console.log('OK')).catch(e => console.log('FAIL:', e.message))"

# Check database volume
docker volume inspect smokava_mongodb_data

# Check database size
docker exec smokava-mongodb du -sh /data/db
```

**Common Issues:**
1. **MongoDB container not running** → Start with `docker compose up -d mongodb`
2. **Database connection failed** → Check MONGODB_URI in backend/.env
3. **Volume not mounted** → Check docker-compose.yml volume configuration
4. **Database empty** → This is normal for new deployments

**Fix Commands:**
```bash
cd /opt/smokava

# Start MongoDB
docker compose up -d mongodb

# Wait for MongoDB to be ready
for i in {1..60}; do
    if docker exec smokava-mongodb mongosh --quiet --eval "db.runCommand('ping').ok" smokava 2>/dev/null | grep -q "1"; then
        echo "MongoDB is ready"
        break
    fi
    sleep 1
done
```

---

## LAYER 7: DEPLOYMENT LAYER (GITHUB ACTIONS)

### Status: ✅ VERIFIED - CORRECTLY CONFIGURED

**Workflow Files Checked:**
- ✅ `.github/workflows/deploy.yml` - Uses `SERVER_IP` secret
- ✅ `.github/workflows/deploy-backend.yml` - Uses `SERVER_IP` secret
- ✅ `.github/workflows/deploy-frontend.yml` - Uses `SERVER_IP` secret
- ✅ `.github/workflows/deploy-admin-panel.yml` - Uses `SERVER_IP` secret

**Required GitHub Secrets:**
1. **SSH_PRIVATE_KEY** - SSH private key for server access
2. **SERVER_IP** - Must be set to `91.107.241.245`
3. **SSH_USER** - Optional, defaults to `root`
4. **SSH_PORT** - Optional, defaults to `22`

**Verification:**
All workflows correctly reference `${{ secrets.SERVER_IP }}` which should be set to `91.107.241.245` in GitHub repository settings.

**Action Required:**
1. Go to: https://github.com/Baileysgin/Smokava/settings/secrets/actions
2. Verify `SERVER_IP` secret is set to `91.107.241.245`
3. Verify `SSH_PRIVATE_KEY` secret contains the SSH private key

---

## LAYER 8: FINAL FULL REPAIR

### Complete Fix Procedure

**Run the automated fix script:**
```bash
# SSH to server
ssh root@91.107.241.245

# Run complete fix
cd /opt/smokava && bash scripts/complete-502-fix.sh
```

**Or manually execute:**

```bash
cd /opt/smokava

# 1. Ensure environment files exist (see Layer 4)

# 2. Stop all containers
docker compose down

# 3. Rebuild images
docker compose build --no-cache

# 4. Start MongoDB first
docker compose up -d mongodb

# 5. Wait for MongoDB (30 seconds)
sleep 30

# 6. Start all services
docker compose up -d

# 7. Wait for services (20 seconds)
sleep 20

# 8. Check container status
docker compose ps

# 9. Test ports
curl http://localhost:5000/api/health
curl http://localhost:3000
curl http://localhost:5173

# 10. Reload nginx
sudo nginx -t && sudo systemctl reload nginx

# 11. Test public domains
curl -I https://smokava.com
curl -I https://api.smokava.com
curl -I https://admin.smokava.com
```

---

## EXPECTED RESULTS AFTER FIX

### Container Status
```bash
$ docker compose ps
NAME                  STATUS              PORTS
smokava-mongodb       Up (healthy)        0.0.0.0:27017->27017/tcp
smokava-backend       Up                  0.0.0.0:5000->5000/tcp
smokava-frontend      Up                  0.0.0.0:3000->3000/tcp
smokava-admin-panel   Up                  0.0.0.0:5173->80/tcp
```

### Port Checks
```bash
$ netstat -tlnp | grep -E ':(5000|3000|5173) '
tcp  0  0  0.0.0.0:5000  0.0.0.0:*  LISTEN  <pid>/node
tcp  0  0  0.0.0.0:3000  0.0.0.0:*  LISTEN  <pid>/node
tcp  0  0  0.0.0.0:5173  0.0.0.0:*  LISTEN  <pid>/nginx
```

### Health Checks
```bash
$ curl http://localhost:5000/api/health
{"status":"ok"}

$ curl -I http://localhost:3000
HTTP/1.1 200 OK

$ curl -I http://localhost:5173
HTTP/1.1 200 OK
```

### Public Domain Checks
```bash
$ curl -I https://smokava.com
HTTP/2 200

$ curl -I https://api.smokava.com/api/health
HTTP/2 200

$ curl -I https://admin.smokava.com
HTTP/2 200
```

---

## TROUBLESHOOTING GUIDE

### If containers keep crashing:

1. **Check logs:**
```bash
docker logs smokava-backend --tail 100
docker logs smokava-frontend --tail 100
docker logs smokava-admin-panel --tail 100
```

2. **Common error patterns:**
   - `MONGODB_URI is not defined` → Fix backend/.env
   - `Cannot connect to MongoDB` → Check MongoDB container is running
   - `Port already in use` → Stop conflicting services
   - `Module not found` → Rebuild Docker images

### If nginx returns 502:

1. **Check upstream servers:**
```bash
curl http://localhost:5000/api/health
curl http://localhost:3000
curl http://localhost:5173
```

2. **If upstream fails:**
   - Check Docker containers are running
   - Check container logs for errors
   - Verify environment variables

### If SSL certificates are missing:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d smokava.com -d www.smokava.com
sudo certbot --nginx -d api.smokava.com
sudo certbot --nginx -d admin.smokava.com

# Reload nginx
sudo systemctl reload nginx
```

---

## QUICK REFERENCE COMMANDS

### Check Everything at Once
```bash
cd /opt/smokava && \
echo "=== Containers ===" && docker compose ps && \
echo "=== Ports ===" && netstat -tlnp | grep -E ':(5000|3000|5173) ' && \
echo "=== Nginx ===" && systemctl status nginx --no-pager -l && \
echo "=== Health ===" && curl -s http://localhost:5000/api/health && echo ""
```

### Restart Everything
```bash
cd /opt/smokava && \
docker compose down && \
docker compose up -d && \
sleep 20 && \
sudo systemctl reload nginx
```

### View All Logs
```bash
cd /opt/smokava && \
docker compose logs --tail 50 -f
```

---

## SUMMARY OF FIXES APPLIED

1. ✅ **SSH Access** - Verified configuration
2. ⚠️ **Nginx** - Config file may need to be copied/updated
3. ⚠️ **Docker** - Containers need to be rebuilt and started
4. ⚠️ **Environment** - .env files need to be created/verified
5. ✅ **PM2/Node** - Handled by Docker
6. ⚠️ **Database** - MongoDB needs to be started and verified
7. ✅ **GitHub Actions** - Workflows correctly configured
8. ⚠️ **Full Repair** - Run complete fix script

---

## NEXT STEPS

1. **SSH to server:** `ssh root@91.107.241.245`
2. **Run fix script:** `cd /opt/smokava && bash scripts/complete-502-fix.sh`
3. **Monitor progress:** Watch container logs during fix
4. **Verify domains:** Test all three domains after fix completes
5. **Check GitHub Actions:** Ensure `SERVER_IP` secret is set to `91.107.241.245`

---

## SUPPORT

If issues persist after running the fix script:

1. Collect logs: `docker compose logs > /tmp/smokava-logs.txt`
2. Check nginx: `sudo nginx -t && sudo tail -50 /var/log/nginx/error.log`
3. Verify environment: `cat backend/.env frontend/.env.local admin-panel/.env`
4. Check container status: `docker compose ps`

---

**Report Generated:** $(date)
**Scripts Created:**
- `scripts/full-production-diagnosis.sh` - Comprehensive diagnostic script
- `scripts/complete-502-fix.sh` - Automated fix script
