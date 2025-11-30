# GitHub Actions Workflows

## Automatic Deployment

When you push code to the `main` branch, GitHub Actions will automatically:

1. ✅ Create database backup
2. ✅ Pull latest code on server
3. ✅ Deploy all services (backend, frontend, admin panel)
4. ✅ Run health checks
5. ✅ Verify services are running

## Required GitHub Secrets

For automatic deployment to work, you must configure these secrets in GitHub:

### Go to: `Settings` → `Secrets and variables` → `Actions`

Add these secrets:

1. **`SSH_PRIVATE_KEY`**
   - Your server SSH private key
   - Generate with: `ssh-keygen -t ed25519 -C "github-actions"`
   - Copy the private key (starts with `-----BEGIN OPENSSH PRIVATE KEY-----`)
   - Add public key to server: `cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys`

2. **`SSH_HOST`**
   - Your server address
   - Format: `user@server.com` or `user@91.107.241.245`
   - Example: `root@91.107.241.245`

3. **`API_URL`** (optional but recommended)
   - Your production API URL
   - Format: `https://api.smokava.com` (without `/api` suffix)
   - Used for health checks

## Setup Instructions

### Step 1: Generate SSH Key for GitHub Actions

On your local machine:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions-smokava" -f ~/.ssh/github_actions_smokava

# Copy private key (you'll add this to GitHub Secrets)
cat ~/.ssh/github_actions_smokava

# Copy public key (add this to server)
cat ~/.ssh/github_actions_smokava.pub
```

### Step 2: Add Public Key to Server

SSH to your server and add the public key:

```bash
ssh user@server
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click `Settings` → `Secrets and variables` → `Actions`
3. Click `New repository secret`
4. Add each secret:
   - `SSH_PRIVATE_KEY`: Paste the private key (entire content)
   - `SSH_HOST`: Your server address (e.g., `root@91.107.241.245`)
   - `API_URL`: Your API URL (e.g., `https://api.smokava.com`)

### Step 4: Test Deployment

Push to main branch:

```bash
git push origin main
```

Check GitHub Actions tab to see deployment progress.

## Workflow Files

- **`deploy.yml`** - Main deployment workflow (triggers on push to main)
- **`backup.yml`** - Manual backup workflow
- **`deploy-backend.yml`** - Backend-only deployment
- **`deploy-frontend.yml`** - Frontend-only deployment
- **`deploy-admin-panel.yml`** - Admin panel-only deployment

## Manual Deployment Trigger

You can also trigger deployment manually:

1. Go to GitHub repository
2. Click `Actions` tab
3. Select `Deploy to Production` workflow
4. Click `Run workflow`
5. Select branch and click `Run workflow`

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs
2. Verify SSH secrets are correct
3. Test SSH connection manually:
   ```bash
   ssh -i ~/.ssh/github_actions_smokava user@server
   ```

### Health Check Fails

- Verify `API_URL` secret is set correctly
- Check if services are actually running on server
- Check server logs: `docker-compose logs -f`

### SSH Connection Issues

- Verify SSH key is added to server's `authorized_keys`
- Check server firewall allows SSH (port 22)
- Verify `SSH_HOST` format is correct

## Security Notes

- ✅ SSH keys are stored securely in GitHub Secrets
- ✅ Private keys never exposed in logs
- ✅ All deployments create backups first
- ✅ Health checks verify deployment success

