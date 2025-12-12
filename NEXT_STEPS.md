# 🚀 NEXT STEPS - 502 FIX EXECUTION

## ✅ What's Been Prepared

All diagnostic and fix scripts have been created and are ready to use:

- ✅ `scripts/complete-502-fix.sh` - Automated fix script
- ✅ `scripts/full-production-diagnosis.sh` - Diagnostic script
- ✅ Complete documentation in markdown files

---

## 🎯 Choose Your Execution Method

### Option 1: Automated Upload & Execute (EASIEST)

If you have SSH access configured locally:

```bash
bash EXECUTE_FIX_NOW.sh
```

This script will:
1. Upload the fix script to your server
2. Execute it automatically
3. Verify the domains are working

**Requirements:** SSH key configured in `~/.ssh/`

---

### Option 2: Manual SSH Execution (RECOMMENDED)

**Step 1:** SSH to your server
```bash
ssh root@91.107.241.245
```

**Step 2:** Navigate to project directory
```bash
cd /opt/smokava
```

**Step 3:** Pull latest code (if scripts are in git)
```bash
git pull origin main
```

**Step 4:** Run the fix script
```bash
bash scripts/complete-502-fix.sh
```

**Step 5:** Wait 15-20 minutes for completion

**Step 6:** Verify domains are working
```bash
curl -I https://smokava.com
curl -I https://api.smokava.com
curl -I https://admin.smokava.com
```

---

### Option 3: Copy Script Manually

If scripts aren't in git yet:

**Step 1:** Copy script content
```bash
cat scripts/complete-502-fix.sh
```

**Step 2:** SSH to server
```bash
ssh root@91.107.241.245
```

**Step 3:** Create script file
```bash
cd /opt/smokava
nano scripts/complete-502-fix.sh
# Paste script content, save (Ctrl+X, Y, Enter)
chmod +x scripts/complete-502-fix.sh
```

**Step 4:** Run it
```bash
bash scripts/complete-502-fix.sh
```

---

### Option 4: Use GitHub Actions

If you want to deploy via GitHub Actions:

1. **Commit and push the scripts:**
```bash
git add scripts/complete-502-fix.sh scripts/full-production-diagnosis.sh
git commit -m "Add 502 fix scripts"
git push origin main
```

2. **Trigger deployment:**
   - Go to: https://github.com/Baileysgin/Smokava/actions
   - Run the "Deploy to Production" workflow
   - Or push will trigger it automatically

3. **SSH to server and run fix:**
```bash
ssh root@91.107.241.245
cd /opt/smokava
git pull
bash scripts/complete-502-fix.sh
```

---

## ⚡ Quick One-Liner (If Scripts Are in Git)

```bash
ssh root@91.107.241.245 "cd /opt/smokava && git pull && bash scripts/complete-502-fix.sh"
```

---

## 🔍 What the Fix Script Does

The `complete-502-fix.sh` script will:

1. ✅ **Layer 1:** Verify SSH access (already connected)
2. ✅ **Layer 2:** Fix Nginx configuration
3. ✅ **Layer 3:** Rebuild and restart Docker containers
4. ✅ **Layer 4:** Create/verify all .env files with correct values
5. ✅ **Layer 5:** Ensure ports are bound correctly
6. ✅ **Layer 6:** Start MongoDB and verify connection
7. ✅ **Layer 7:** (GitHub Actions already verified)
8. ✅ **Layer 8:** Full system restart and verification

**Time:** 15-20 minutes (mostly Docker image rebuild)

---

## 📊 Verification Checklist

After running the fix, verify:

- [ ] `docker compose ps` shows all 4 containers running
- [ ] `curl http://localhost:5000/api/health` returns `{"status":"ok"}`
- [ ] `curl http://localhost:3000` returns HTML
- [ ] `curl http://localhost:5173` returns HTML
- [ ] `curl -I https://smokava.com` returns HTTP 200
- [ ] `curl -I https://api.smokava.com` returns HTTP 200
- [ ] `curl -I https://admin.smokava.com` returns HTTP 200

---

## 🐛 If Something Goes Wrong

### Check Container Logs
```bash
ssh root@91.107.241.245
cd /opt/smokava
docker compose logs --tail 100
```

### Check Container Status
```bash
docker compose ps
```

### Check Ports
```bash
netstat -tlnp | grep -E ':(5000|3000|5173) '
```

### Run Diagnostic
```bash
bash scripts/full-production-diagnosis.sh
```

---

## 📝 Important Notes

1. **GitHub Secrets:** Ensure `SERVER_IP` is set to `91.107.241.245` in GitHub repository settings
2. **SSH Access:** You need SSH key access to the server
3. **Backup:** The script preserves database volumes (safe)
4. **Downtime:** Expect 15-20 minutes of downtime during fix

---

## ✅ Recommended Next Step

**I recommend Option 2 (Manual SSH Execution)** as it gives you full visibility:

```bash
# 1. SSH to server
ssh root@91.107.241.245

# 2. Go to project
cd /opt/smokava

# 3. Pull latest (if scripts are in git)
git pull origin main

# 4. Run fix
bash scripts/complete-502-fix.sh

# 5. Monitor progress (watch the output)
```

---

**Ready to proceed?** Choose your preferred method above and execute!
