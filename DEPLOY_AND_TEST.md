# 🚀 Deploy and Test - Complete Instructions

## Step 1: Deploy the Fix

SSH into your server and run:

```bash
cd /opt/smokava
git pull origin main
sudo bash FIX_502_FINAL.sh
```

**OR** use the ultimate fix:

```bash
sudo bash scripts/fix-502-ultimate.sh
```

## Step 2: Wait

Wait 30-60 seconds for everything to stabilize.

## Step 3: Test

### Option A: Quick Test (from anywhere)
```bash
curl -I -k https://admin.smokava.com
```

Should return: `HTTP/2 200` or `HTTP/2 301` or `HTTP/2 302`

### Option B: Full Test (on server)
```bash
cd /opt/smokava
bash scripts/test-deployment.sh
```

### Option C: Quick Test Script
```bash
bash scripts/quick-test.sh
```

## Step 4: Verify in Browser

1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Try incognito/private mode
3. Visit: https://admin.smokava.com

## ✅ Success Indicators

- ✅ HTTP Status: 200, 301, or 302 (NOT 502)
- ✅ Page loads in browser
- ✅ Login page appears
- ✅ No "502 Bad Gateway" error

## ❌ If Still 502

1. **Check container status:**
   ```bash
   docker compose ps admin-panel
   ```

2. **Check container logs:**
   ```bash
   docker compose logs --tail=50 admin-panel
   ```

3. **Check nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Restart everything:**
   ```bash
   cd /opt/smokava
   sudo bash scripts/fix-502-ultimate.sh
   ```

## 📊 Test Results

After running the test, you should see:

```
╔══════════════════════════════════════════════════════════╗
║         ✅ ALL TESTS PASSED! DEPLOYMENT SUCCESSFUL!     ║
╚══════════════════════════════════════════════════════════╝
```

If you see this, the deployment is successful! 🎉

