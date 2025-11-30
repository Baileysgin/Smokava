# Git Setup for Server Deployment

## Problem
The server cannot pull from GitHub because it's using HTTPS which requires credentials in a non-interactive session.

## Solutions

### Option 1: Use SSH (Recommended for Automation)

1. **SSH into the server:**
   ```bash
   ssh root@91.107.241.245
   ```

2. **Generate SSH key (if not exists):**
   ```bash
   ssh-keygen -t ed25519 -C "server@smokava"
   # Press Enter to accept default location
   # Press Enter twice for no passphrase (or set one)
   ```

3. **Copy the public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

4. **Add to GitHub:**
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Title: "Smokava Server"
   - Paste the public key
   - Click "Add SSH key"

5. **Change git remote to SSH:**
   ```bash
   cd /opt/smokava
   git remote set-url origin git@github.com:Baileysgin/Smokava.git
   ```

6. **Test:**
   ```bash
   git pull origin main
   ```

### Option 2: Use Personal Access Token (HTTPS)

1. **Create a Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Name: "Smokava Server Deploy"
   - Select scopes: `repo` (full control of private repositories)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **SSH into server:**
   ```bash
   ssh root@91.107.241.245
   cd /opt/smokava
   ```

3. **Configure git credential helper:**
   ```bash
   git config --global credential.helper store
   ```

4. **Pull once manually (to cache credentials):**
   ```bash
   git pull origin main
   # Username: Baileysgin (or your GitHub username)
   # Password: <paste the token here>
   ```

5. **Verify it's cached:**
   ```bash
   cat ~/.git-credentials
   # Should show: https://<token>@github.com
   ```

### Option 3: Use GitHub CLI

1. **Install GitHub CLI:**
   ```bash
   ssh root@91.107.241.245
   apt update && apt install -y gh
   ```

2. **Login:**
   ```bash
   gh auth login
   # Follow prompts:
   # - GitHub.com
   # - HTTPS
   # - Authenticate Git with your GitHub credentials? Yes
   # - Login via web browser
   ```

3. **Test:**
   ```bash
   cd /opt/smokava
   git pull origin main
   ```

## Quick Fix Script

Run this locally to set up SSH on the server:

```bash
./scripts/fix-server-git.sh
```

Or manually SSH and run:

```bash
ssh root@91.107.241.245
cd /opt/smokava
git remote set-url origin git@github.com:Baileysgin/Smokava.git
```

## Verify Setup

After setup, test the deployment:

```bash
./scripts/deploy-to-server.sh
```

## Troubleshooting

### "Permission denied (publickey)"
- Make sure SSH key is added to GitHub
- Test: `ssh -T git@github.com`
- Should see: "Hi Baileysgin! You've successfully authenticated..."

### "fatal: could not read Username"
- Git is still using HTTPS
- Check: `git remote -v`
- Should show: `git@github.com:Baileysgin/Smokava.git`
- If it shows `https://`, change it: `git remote set-url origin git@github.com:Baileysgin/Smokava.git`

### "Host key verification failed"
- Add GitHub to known hosts:
  ```bash
  ssh-keyscan github.com >> ~/.ssh/known_hosts
  ```

