# Auto-Deploy Setup

## 🚀 Automatic Deployment to Server

This setup allows automatic deployment to your server whenever you push code to GitHub.

## Scripts Created

### 1. `scripts/check-server-connection.sh`
Checks server connectivity and deployment readiness.

**Usage:**
```bash
./scripts/check-server-connection.sh
```

**What it checks:**
- ✅ SSH connection
- ✅ Project directory exists
- ✅ Git repository status
- ✅ Docker installation
- ✅ Services status
- ✅ Git sync status

### 2. `scripts/auto-deploy-to-server.sh`
Automatically deploys code to server.

**Usage:**
```bash
./scripts/auto-deploy-to-server.sh
```

**What it does:**
1. Pushes code to GitHub
2. Connects to server
3. Pulls latest code on server
4. Creates backup
5. Deploys services
6. Ensures admin user exists
7. Runs health checks

## Setup Options

### Option 1: Manual Auto-Deploy

Run the script manually after pushing:

```bash
./scripts/auto-deploy-to-server.sh
```

### Option 2: Git Hook (Automatic)

Enable automatic deployment after each push:

```bash
# Enable auto-deploy
export AUTO_DEPLOY=true

# Or add to your shell profile (~/.bashrc or ~/.zshrc)
echo 'export AUTO_DEPLOY=true' >> ~/.bashrc
```

Then every `git push` will automatically deploy to server.

### Option 3: GitHub Actions (Recommended)

If GitHub Actions secrets are configured, deployment happens automatically on push.

## Configuration

### Server Details

Set these environment variables or edit the scripts:

```bash
export SSH_HOST="root@91.107.241.245"
export REMOTE_DIR="/opt/smokava"
export API_BASE_URL="https://api.smokava.com"
```

### Enable Auto-Deploy

**Temporary (current session):**
```bash
export AUTO_DEPLOY=true
```

**Permanent (add to ~/.bashrc or ~/.zshrc):**
```bash
echo 'export AUTO_DEPLOY=true' >> ~/.bashrc
source ~/.bashrc
```

## Workflow

### Normal Workflow:

1. **Make changes:**
   ```bash
   # Edit files
   git add .
   git commit -m "your message"
   ```

2. **Push and deploy:**
   ```bash
   git push origin main
   # If AUTO_DEPLOY=true, deployment happens automatically
   # Otherwise, run:
   ./scripts/auto-deploy-to-server.sh
   ```

### Quick Deploy:

```bash
# Push to git and deploy in one command
./scripts/auto-deploy-to-server.sh
```

## Troubleshooting

### Connection Failed

```bash
# Test connection
./scripts/check-server-connection.sh

# Check SSH key
ssh -v root@91.107.241.245

# Test manually
ssh root@91.107.241.245 "cd /opt/smokava && pwd"
```

### Deployment Failed

1. Check server logs:
   ```bash
   ssh root@91.107.241.245 "cd /opt/smokava && docker-compose logs backend --tail=50"
   ```

2. Check services:
   ```bash
   ssh root@91.107.241.245 "cd /opt/smokava && docker-compose ps"
   ```

3. Manual deployment:
   ```bash
   ssh root@91.107.241.245 "cd /opt/smokava && git pull && bash scripts/deploy.sh"
   ```

## Security Notes

- ✅ SSH keys used for authentication
- ✅ No passwords in scripts
- ✅ Backups created before deployment
- ⚠️ Keep SSH keys secure
- ⚠️ Don't commit sensitive data

## Quick Reference

```bash
# Check server connection
./scripts/check-server-connection.sh

# Deploy to server
./scripts/auto-deploy-to-server.sh

# Enable auto-deploy
export AUTO_DEPLOY=true

# Disable auto-deploy
unset AUTO_DEPLOY
```

