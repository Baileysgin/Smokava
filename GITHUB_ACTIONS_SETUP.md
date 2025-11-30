# GitHub Actions Automatic Deployment Setup

## ✅ Automatic Deployment is Configured!

When you push code to the `main` branch, GitHub Actions will **automatically deploy** to your server.

## 🔧 Setup Required (One-Time)

To enable automatic deployment, you need to configure GitHub Secrets:

### Step 1: Generate SSH Key

On your local machine, generate an SSH key for GitHub Actions:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions-smokava" -f ~/.ssh/github_actions_smokava

# Press Enter when asked for passphrase (or set one if you prefer)
```

### Step 2: Add Public Key to Server

Copy the public key and add it to your server:

```bash
# Display public key
cat ~/.ssh/github_actions_smokava.pub
```

Then SSH to your server and add it:

```bash
# SSH to server
ssh user@your-server.com

# Add public key
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Add Secrets to GitHub

1. Go to your GitHub repository: `https://github.com/Baileysgin/Smokava`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these 3 secrets:

#### Secret 1: `SSH_PRIVATE_KEY`
- **Name**: `SSH_PRIVATE_KEY`
- **Value**: Copy the entire private key:
  ```bash
  cat ~/.ssh/github_actions_smokava
  ```
- Copy everything including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`

#### Secret 2: `SSH_HOST`
- **Name**: `SSH_HOST`
- **Value**: Your server address
  - Format: `user@server.com` or `user@IP_ADDRESS`
  - Example: `root@91.107.241.245`

#### Secret 3: `API_URL` (Optional but recommended)
- **Name**: `API_URL`
- **Value**: Your production API URL
  - Format: `https://api.smokava.com` (without `/api` suffix)
  - Used for health checks

### Step 4: Test the Connection

Test that GitHub Actions can connect to your server:

1. Go to GitHub repository
2. Click **Actions** tab
3. Select **Deploy to Production** workflow
4. Click **Run workflow** → **Run workflow**
5. Watch the deployment progress

## 🚀 How It Works

### Automatic Deployment Flow:

1. **You push code**:
   ```bash
   ./scripts/push-to-git.sh "your commit message"
   ```

2. **GitHub Actions triggers automatically**:
   - Creates database backup
   - Pulls latest code on server
   - Deploys all services
   - Runs health checks

3. **Deployment complete**:
   - Check GitHub Actions tab for status
   - Services are automatically updated

### What Gets Deployed:

- ✅ Backend API
- ✅ Frontend application
- ✅ Admin panel
- ✅ All services restarted safely
- ✅ Database backup created before deployment

## 📊 Monitoring Deployment

### Check Deployment Status:

1. Go to GitHub repository
2. Click **Actions** tab
3. See all deployment runs
4. Click on a run to see detailed logs

### On Server:

After deployment, verify services:

```bash
ssh user@server
cd /opt/smokava
docker-compose ps
curl https://api.smokava.com/api/health
```

## 🔍 Troubleshooting

### Deployment Fails

**Check GitHub Actions logs:**
1. Go to Actions tab
2. Click on failed workflow
3. Check error messages

**Common issues:**

1. **SSH connection failed**
   - Verify `SSH_PRIVATE_KEY` and `SSH_HOST` secrets are correct
   - Test SSH manually: `ssh -i ~/.ssh/github_actions_smokava user@server`

2. **Health check failed**
   - Verify `API_URL` secret is set correctly
   - Check if services are running on server
   - Health check failure doesn't stop deployment, but indicates an issue

3. **Git pull failed**
   - Verify server has access to GitHub repository
   - Check git credentials on server

### Manual Deployment (If Needed)

If automatic deployment fails, deploy manually:

```bash
ssh user@server
cd /opt/smokava
git pull origin main
bash scripts/deploy.sh
```

## 🔒 Security

- ✅ SSH keys stored securely in GitHub Secrets
- ✅ Private keys never exposed in logs
- ✅ All deployments create backups first
- ✅ Health checks verify deployment success

## 📝 Summary

Once you configure the 3 GitHub Secrets:
- ✅ Every push to `main` automatically deploys
- ✅ Database backup created before each deployment
- ✅ All services updated safely
- ✅ Health checks verify success

**No more manual deployment needed!** 🎉
