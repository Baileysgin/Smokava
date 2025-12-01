# 🚀 Trigger GitHub Actions Deployment

## Method 1: Manual Trigger via GitHub Web Interface (Easiest)

1. **Go to GitHub Actions:**
   - Open: https://github.com/Baileysgin/Smokava/actions

2. **Select the Workflow:**
   - Click on "Deploy to Production" workflow

3. **Trigger Manually:**
   - Click the "Run workflow" dropdown button (top right)
   - Select branch: `main`
   - Click "Run workflow" button

4. **Monitor Progress:**
   - Watch the workflow run in real-time
   - Check each step for success/failure
   - The deployment will run automatically

## Method 2: Automatic Trigger (Already Configured)

The workflow is configured to trigger automatically on push to `main` branch.

**To trigger automatically:**
```bash
git push origin main
```

Since we've already pushed the fix, the workflow should have triggered. Check:
- https://github.com/Baileysgin/Smokava/actions

## Method 3: Trigger via GitHub CLI (if installed)

```bash
gh workflow run deploy.yml
```

## What the Workflow Does

1. ✅ Checks out latest code
2. ✅ Creates database backup
3. ✅ Connects to server via SSH
4. ✅ Pulls latest code on server
5. ✅ Runs `scripts/fix-production-502.sh`
6. ✅ Fixes port mapping (5001→5000)
7. ✅ Restarts backend
8. ✅ Tests services
9. ✅ Reloads nginx
10. ✅ Runs health checks

## Check Deployment Status

After triggering, monitor:
- **GitHub Actions:** https://github.com/Baileysgin/Smokava/actions
- **Latest Run:** Click on the most recent workflow run
- **View Logs:** Click on each step to see detailed output

## Verify Deployment

After workflow completes, test:

```bash
curl -I https://api.smokava.com/api/health
curl -I https://smokava.com
curl -I https://admin.smokava.com
```

All should return 200 (not 502).

## Troubleshooting

### If Workflow Fails:

1. **Check SSH Connection:**
   - Verify `SSH_PRIVATE_KEY` secret is set in GitHub
   - Verify `SSH_HOST` secret is set (should be `root@91.107.241.245`)

2. **Check Server Access:**
   - Ensure server is accessible from internet
   - Check firewall allows SSH (port 22)

3. **Check Secrets:**
   - Go to: Settings → Secrets and variables → Actions
   - Verify all required secrets are set

### Required GitHub Secrets:

- `SSH_PRIVATE_KEY` - Your SSH private key for server access
- `SSH_HOST` - Server connection string (e.g., `root@91.107.241.245`)
- `API_URL` (optional) - For health checks

## Next Steps

1. Go to: https://github.com/Baileysgin/Smokava/actions
2. Click "Deploy to Production"
3. Click "Run workflow"
4. Select "main" branch
5. Click "Run workflow"
6. Monitor the deployment

The fix is already in the code - just needs to be deployed!

