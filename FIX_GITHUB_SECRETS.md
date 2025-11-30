# 🔧 Fix GitHub Actions Deployment Failure

## ❌ Error Found

The deployment failed because:
1. **Invalid input**: `ssh-known-hosts` is not supported by `webfactory/ssh-agent@v0.7.0`
2. **Missing secret**: `SSH_PRIVATE_KEY` is not configured in GitHub secrets

## ✅ Fix Applied

1. ✅ Removed invalid `ssh-known-hosts` input from workflow
2. ⚠️ **YOU NEED TO**: Add `SSH_PRIVATE_KEY` secret to GitHub

## 🔑 How to Add SSH_PRIVATE_KEY Secret

### Step 1: Generate SSH Key (if you don't have one)

```bash
# On your local machine or server
ssh-keygen -t ed25519 -C "github-actions-smokava" -f ~/.ssh/github_actions_smokava

# This creates:
# - ~/.ssh/github_actions_smokava (private key)
# - ~/.ssh/github_actions_smokava.pub (public key)
```

### Step 2: Add Public Key to Server

```bash
# Copy public key to server's authorized_keys
ssh-copy-id -i ~/.ssh/github_actions_smokava.pub your-server-user@your-server-ip

# Or manually:
cat ~/.ssh/github_actions_smokava.pub | ssh your-server-user@your-server-ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Step 3: Add Private Key to GitHub Secrets

1. Go to: https://github.com/Baileysgin/Smokava/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SSH_PRIVATE_KEY`
4. Value: Copy the entire contents of `~/.ssh/github_actions_smokava` (the private key)
   ```bash
   cat ~/.ssh/github_actions_smokava
   ```
5. Click "Add secret"

### Step 4: Add SSH_HOST Secret (if not already added)

1. Go to: https://github.com/Baileysgin/Smokava/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SSH_HOST`
4. Value: Your server connection string (e.g., `root@91.107.241.245` or `user@your-server.com`)
5. Click "Add secret"

### Step 5: Verify Secrets

Required secrets:
- ✅ `SSH_PRIVATE_KEY` - Your SSH private key
- ✅ `SSH_HOST` - Server connection string (e.g., `root@91.107.241.245`)
- ⚠️ `API_URL` - Optional (defaults to `https://api.smokava.com`)

## 🚀 After Adding Secrets

1. Go to: https://github.com/Baileysgin/Smokava/actions
2. Click "Re-run jobs" on the failed workflow
3. Or push a new commit to trigger deployment

## 🔍 Test SSH Connection

Before adding to GitHub, test the SSH key works:

```bash
ssh -i ~/.ssh/github_actions_smokava your-server-user@your-server-ip "echo 'SSH connection successful'"
```

If this works, the key is correct!
