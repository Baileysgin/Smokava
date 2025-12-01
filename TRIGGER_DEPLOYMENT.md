# 🚀 Trigger Deployment

## Option 1: GitHub Actions (Automatic)

The deployment will trigger automatically when you push to main (which we just did).

**Check deployment status:**
- Go to: https://github.com/Baileysgin/Smokava/actions
- Look for the latest "Deploy to Production" workflow run

**Or trigger manually:**
1. Go to: https://github.com/Baileysgin/Smokava/actions
2. Click "Deploy to Production" workflow
3. Click "Run workflow" button
4. Select "main" branch
5. Click "Run workflow"

## Option 2: Manual SSH Deployment

If GitHub Actions fails or you prefer manual deployment:

```bash
# SSH into your server
ssh root@91.107.241.245

# Run the fix script
cd /opt/smokava && git pull && sudo bash scripts/fix-production-502.sh
```

## Option 3: One-Line Remote Command

From your local machine:

```bash
ssh root@91.107.241.245 "cd /opt/smokava && git pull && sudo bash scripts/fix-production-502.sh"
```

## What Happens

1. ✅ Pulls latest code from GitHub
2. ✅ Fixes port mapping (5001→5000)
3. ✅ Restarts backend container
4. ✅ Tests all services
5. ✅ Reloads nginx
6. ✅ Verifies production URLs

## Verification

After deployment, test:

```bash
curl -I https://api.smokava.com/api/health
curl -I https://smokava.com
curl -I https://admin.smokava.com
```

All should return 200 (not 502).

