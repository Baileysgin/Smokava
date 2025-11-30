# GitHub Secrets Setup - Quick Guide

## ✅ SSH Key Generated!

Your SSH key has been generated at: `~/.ssh/github_actions_smokava`

## 📋 Step-by-Step Setup

### Step 1: Add Public Key to Server

**Your public key:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIzvQFTtnH7l+4EAWc3KiNwP+W5/E1iLjyp335a7E01u github-actions-smokava
```

**On your server, run:**
```bash
ssh user@your-server.com
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIzvQFTtnH7l+4EAWc3KiNwP+W5/E1iLjyp335a7E01u github-actions-smokava' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 2: Add Secrets to GitHub

1. **Go to GitHub Secrets:**
   - Visit: https://github.com/Baileysgin/Smokava/settings/secrets/actions
   - Click **"New repository secret"**

2. **Add Secret 1: SSH_PRIVATE_KEY**
   - **Name:** `SSH_PRIVATE_KEY`
   - **Value:** Copy the entire private key from:
     ```bash
     cat ~/.ssh/github_actions_smokava
     ```
   - Copy everything including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`

3. **Add Secret 2: SSH_HOST**
   - **Name:** `SSH_HOST`
   - **Value:** Your server address
     - Example: `root@91.107.241.245`
     - Or: `user@smokava.com`

4. **Add Secret 3: API_URL**
   - **Name:** `API_URL`
   - **Value:** Your API URL (without `/api` suffix)
     - Example: `https://api.smokava.com`

### Step 3: Test the Setup

After adding secrets, test by pushing code:

```bash
./scripts/push-to-git.sh "test: Test automatic deployment"
```

Then check GitHub Actions:
- Go to: https://github.com/Baileysgin/Smokava/actions
- You should see a workflow running

## 🔍 Get Your Private Key

To get your private key for GitHub Secrets:

```bash
cat ~/.ssh/github_actions_smokava
```

Copy the entire output (it's a multi-line key).

## ✅ Verification

Once setup is complete:

1. ✅ Public key added to server
2. ✅ All 3 secrets added to GitHub
3. ✅ Push code to test automatic deployment

## 🚀 After Setup

Once configured, every push to `main` will automatically:
- Create database backup
- Pull latest code on server
- Deploy all services
- Run health checks

**No more manual deployment needed!** 🎉
