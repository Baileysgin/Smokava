# 🚨 URGENT: 502 BAD GATEWAY FIX - QUICK START

**All domains returning 502:** https://smokava.com, https://api.smokava.com, https://admin.smokava.com

---

## ⚡ IMMEDIATE ACTION (5 MINUTES)

### Step 1: SSH to Server
```bash
ssh root@91.107.241.245
```

### Step 2: Run Automated Fix
```bash
cd /opt/smokava
bash scripts/complete-502-fix.sh
```

**That's it!** The script will:
- ✅ Fix all environment files
- ✅ Rebuild Docker containers
- ✅ Start all services
- ✅ Reload Nginx
- ✅ Verify everything is working

---

## 🔍 IF AUTOMATED FIX FAILS - MANUAL STEPS

### Quick Manual Fix (10 minutes)

```bash
# 1. SSH to server
ssh root@91.107.241.245
cd /opt/smokava

# 2. Create missing .env files
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

cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://api.smokava.com/api
BACKEND_URL=https://api.smokava.com
NEXT_PUBLIC_MAPBOX_TOKEN=
EOF

cat > admin-panel/.env << 'EOF'
VITE_API_URL=https://api.smokava.com/api
EOF

# 3. Rebuild and start containers
docker compose down
docker compose build --no-cache
docker compose up -d mongodb
sleep 30
docker compose up -d

# 4. Wait for services
sleep 20

# 5. Check status
docker compose ps

# 6. Test ports
curl http://localhost:5000/api/health
curl http://localhost:3000
curl http://localhost:5173

# 7. Reload nginx
sudo nginx -t && sudo systemctl reload nginx

# 8. Test domains
curl -I https://smokava.com
curl -I https://api.smokava.com
curl -I https://admin.smokava.com
```

---

## 🐛 TROUBLESHOOTING

### Containers not starting?
```bash
# Check logs
docker logs smokava-backend --tail 50
docker logs smokava-frontend --tail 50
docker logs smokava-admin-panel --tail 50
docker logs smokava-mongodb --tail 50
```

### Nginx still returning 502?
```bash
# Check if ports are listening
netstat -tlnp | grep -E ':(5000|3000|5173) '

# If ports not listening, containers aren't running
docker compose ps
docker compose up -d
```

### MongoDB connection failed?
```bash
# Check MongoDB is running
docker ps | grep mongodb

# Check MongoDB health
docker exec smokava-mongodb mongosh --eval "db.runCommand('ping')" smokava

# Verify MONGODB_URI in backend/.env
cat backend/.env | grep MONGODB_URI
```

---

## ✅ VERIFICATION CHECKLIST

After running the fix, verify:

- [ ] `docker compose ps` shows all 4 containers running
- [ ] `curl http://localhost:5000/api/health` returns `{"status":"ok"}`
- [ ] `curl http://localhost:3000` returns HTML (200 OK)
- [ ] `curl http://localhost:5173` returns HTML (200 OK)
- [ ] `curl -I https://smokava.com` returns HTTP 200
- [ ] `curl -I https://api.smokava.com/api/health` returns HTTP 200
- [ ] `curl -I https://admin.smokava.com` returns HTTP 200

---

## 📋 FULL DIAGNOSTIC REPORT

For complete details, see: `COMPLETE_502_DIAGNOSIS_AND_FIX.md`

---

**Last Updated:** $(date)
