# 🔑 Quick SSH Setup for GitHub Actions

## ✅ Your SSH Key is Ready!

Your SSH key already exists at: `~/.ssh/github_actions_smokava`

## 📋 Steps to Add to GitHub

### Step 1: Copy Your Private Key

Run this command to see your private key:
```bash
cat ~/.ssh/github_actions_smokava
```

Copy the **ENTIRE** output (including `-----BEGIN` and `-----END` lines).

### Step 2: Add SSH_PRIVATE_KEY Secret

1. Go to: **https://github.com/Baileysgin/Smokava/settings/secrets/actions**
2. Click **"New repository secret"**
3. **Name**: `SSH_PRIVATE_KEY`
4. **Value**: Paste the entire private key you copied
5. Click **"Add secret"**

### Step 3: Add SSH_HOST Secret (if not already added)

1. Go to: **https://github.com/Baileysgin/Smokava/settings/secrets/actions**
2. Click **"New repository secret"**
3. **Name**: `SSH_HOST`
4. **Value**: Your server connection string (e.g., `root@91.107.241.245`)
5. Click **"Add secret"**

### Step 4: Verify Public Key is on Server

Make sure your public key is in the server's `~/.ssh/authorized_keys`:

```bash
# Check if key is on server
ssh your-server "grep 'github-actions-smokava' ~/.ssh/authorized_keys"

# If not found, add it:
cat ~/.ssh/github_actions_smokava.pub | ssh your-server "cat >> ~/.ssh/authorized_keys"
```

### Step 5: Test Connection

```bash
ssh -i ~/.ssh/github_actions_smokava your-server "echo 'Connection successful'"
```

### Step 6: Trigger Deployment

After adding secrets:
1. Go to: **https://github.com/Baileysgin/Smokava/actions**
2. Click **"Re-run jobs"** on the failed workflow
3. Or push a new commit

## ✅ Required Secrets Checklist

- [ ] `SSH_PRIVATE_KEY` - Your private key
- [ ] `SSH_HOST` - Server connection (e.g., `root@91.107.241.245`)
- [ ] `API_URL` - Optional (defaults to `https://api.smokava.com`)

## 🚀 After Setup

The deployment will automatically:
1. Connect to your server via SSH
2. Pull latest code
3. Rebuild and deploy all services
4. Run health checks

