# Manual Deployment Guide (When GitHub Actions Fails)

If GitHub Actions deployment fails due to SSH connection issues, you can deploy manually.

## 🚀 Quick Manual Deploy

SSH into your server and run:

```bash
cd /opt/smokava
git pull origin main
sudo bash scripts/fix-502-bulletproof.sh
```

That's it! This will:
- Pull latest code
- Fix the 502 Bad Gateway issue
- Verify everything works

## 📋 Step-by-Step Manual Deploy

### 1. Connect to Server

```bash
ssh your-user@your-server-ip
```

### 2. Navigate to Project

```bash
cd /opt/smokava
```

### 3. Pull Latest Code

```bash
git pull origin main
```

### 4. Run Fix Script

```bash
sudo bash scripts/fix-502-bulletproof.sh
```

### 5. Verify

Wait 30 seconds, then check:
```bash
curl -I http://localhost:5173
```

Should return HTTP 200, 301, 302, or 404.

## 🔧 Fix GitHub Actions SSH Issues

If you want to fix the GitHub Actions deployment:

### Option 1: Check Server Accessibility

```bash
# On your server, check if SSH is running
sudo systemctl status ssh

# Check if port 22 is open
sudo netstat -tlnp | grep :22
```

### Option 2: Check Firewall

```bash
# Check firewall rules
sudo ufw status
sudo iptables -L -n | grep 22
```

### Option 3: Update GitHub Secrets

Make sure these secrets are set in GitHub:
- `SSH_HOST` - Should be: `user@91.107.241.245` (or your server IP)
- `SSH_PRIVATE_KEY` - Your SSH private key
- `SSH_USER` - Your SSH username
- `SSH_PORT` - Usually 22

### Option 4: Test SSH from GitHub Actions

The workflow now has better error messages. Check the workflow logs to see what's failing.

## ✅ After Manual Deploy

1. **Wait 30-60 seconds**
2. **Clear browser cache**
3. **Try**: https://admin.smokava.com

## 🆘 Still Having Issues?

Run the test script:
```bash
sudo bash scripts/test-admin-panel.sh
```

This will show you exactly what's working and what's not.

