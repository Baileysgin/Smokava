# 🚀 Quick Deploy - Copy & Paste These Commands

The fix is ready in GitHub. You just need to deploy it on the server.

## One-Line Deployment

**SSH into server and run:**

```bash
ssh root@91.107.241.245 "cd /opt/smokava && git pull origin main && docker compose build --no-cache admin-panel && docker compose up -d admin-panel && docker compose ps admin-panel"
```

## Or Step-by-Step:

```bash
# 1. SSH into server
ssh root@91.107.241.245

# 2. Navigate to project
cd /opt/smokava

# 3. Pull latest code
git pull origin main

# 4. Rebuild admin panel
docker compose build --no-cache admin-panel

# 5. Restart container
docker compose up -d admin-panel

# 6. Check status
docker compose ps admin-panel
docker compose logs --tail=20 admin-panel
```

## After Deployment:

1. **Hard refresh your browser:** `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. **Or use incognito/private window**
3. **Check console** - the error should be gone!

The new build will have different file names (not `vendor-DNSaSWsQ.js` anymore).
