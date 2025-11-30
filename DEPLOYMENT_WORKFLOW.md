# Deployment Workflow

## ⚠️ Important: Never Deploy Directly to Server

**Always use this workflow:**
1. Push code to GitHub
2. Deploy on server by pulling from git

## Step 1: Push to GitHub

Use the git-only push script:

```bash
# With custom commit message
./scripts/push-to-git.sh "feat: Add new feature"

# With default commit message
./scripts/push-to-git.sh
```

This script:
- ✅ Stages all changes
- ✅ Commits with message
- ✅ Pushes to GitHub
- ❌ Does NOT deploy to server

## Step 2: Deploy on Server

### Option A: Manual Deployment (Recommended)

SSH to your server and deploy:

```bash
# SSH to server
ssh user@your-server.com

# Navigate to project
cd /opt/smokava

# Pull latest code
git pull origin main

# Deploy safely
bash scripts/deploy.sh
```

### Option B: Automatic Deployment via CI/CD

If GitHub Actions is configured:

1. Push to GitHub (triggers workflow automatically)
2. GitHub Actions will:
   - Create backup
   - Pull code on server
   - Build and deploy services
   - Run health checks

**Required GitHub Secrets:**
- `SSH_PRIVATE_KEY` - Your server SSH private key
- `SSH_HOST` - Server address (e.g., `user@server.com`)
- `API_URL` - Your API URL (e.g., `https://api.smokava.com`)

## Why This Workflow?

### Benefits:
- ✅ Version control - all changes tracked in git
- ✅ Rollback capability - can revert to any commit
- ✅ Team collaboration - everyone sees changes
- ✅ CI/CD integration - automatic deployment
- ✅ Safety - no direct server access from local machine

### Problems with Direct Deployment:
- ❌ No version control
- ❌ Hard to rollback
- ❌ Team can't see changes
- ❌ Security risk (credentials in scripts)
- ❌ No deployment history

## Quick Reference

### Push Code:
```bash
./scripts/push-to-git.sh "your commit message"
```

### Deploy on Server:
```bash
ssh user@server "cd /opt/smokava && git pull && bash scripts/deploy.sh"
```

### Check Deployment Status:
```bash
# On server
cd /opt/smokava
docker-compose ps
curl https://api.smokava.com/api/health
```

## Troubleshooting

### Git Push Fails:
- Check internet connection
- Verify git credentials
- Check GitHub repository access

### Server Deployment Fails:
- SSH to server and check logs: `docker-compose logs -f`
- Verify .env file is configured
- Check disk space: `df -h`
- Verify Docker is running: `docker ps`

## Best Practices

1. **Always push before deploying** - ensures code is saved
2. **Test locally first** - verify changes work before pushing
3. **Use descriptive commit messages** - helps track changes
4. **Deploy during low-traffic periods** - reduces impact
5. **Monitor after deployment** - check logs and health endpoints
6. **Keep backups** - automated hourly backups are configured

