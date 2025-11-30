# Quick Git Token Setup Guide

## Automatic Setup (Recommended)

Run this script and follow the prompts:

```bash
./scripts/setup-git-token.sh
```

The script will:
1. Configure git credential helper on server
2. Guide you to create a GitHub token
3. Save credentials securely
4. Test the connection

## Manual Setup

If you prefer to do it manually:

### 1. Create GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click: **"Generate new token"** > **"Generate new token (classic)"**
3. Name: `Smokava Server Deploy`
4. Expiration: `No expiration` (or set a long date)
5. Select scope: ✅ **`repo`** (Full control of private repositories)
6. Click: **"Generate token"**
7. **COPY THE TOKEN** (you won't see it again!)

### 2. Configure on Server

SSH into server and run:

```bash
ssh root@91.107.241.245

# Configure credential helper
git config --global credential.helper store

# Save credentials (replace USERNAME and TOKEN)
echo "https://Baileysgin:YOUR_TOKEN_HERE@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials

# Test
cd /opt/smokava
git pull origin main
```

### 3. Verify

If `git pull` works without asking for credentials, you're all set! ✅

## Security Notes

- The token is stored in `~/.git-credentials` on the server
- File permissions are set to 600 (readable only by owner)
- Token has full repo access - keep it secure
- If token is compromised, revoke it immediately on GitHub

## Troubleshooting

**"Authentication failed"**
- Check token hasn't expired
- Verify token has `repo` scope
- Check username is correct

**"Permission denied"**
- Verify token is correct
- Check file permissions: `ls -l ~/.git-credentials` (should be 600)

**"fatal: could not read Username"**
- Credential helper not configured
- Run: `git config --global credential.helper store`

