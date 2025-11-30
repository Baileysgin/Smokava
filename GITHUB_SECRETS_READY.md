# GitHub Secrets - Ready to Copy & Paste

## ✅ Step 1: SSH Key Added to Server (DONE!)

The public key has been added to your server automatically.

## 📋 Step 2: Add Secrets to GitHub

Go to: **https://github.com/Baileysgin/Smokava/settings/secrets/actions**

Click **"New repository secret"** for each one:

---

### Secret 1: SSH_PRIVATE_KEY

**Name:** `SSH_PRIVATE_KEY`

**Value:** (Copy the entire block below)
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCM70BU7Zx+5fuBAFnNyojcD/lufxNYi48qd9+WuxNNbgAAAKCvfvpXr376
VwAAAAtzc2gtZWQyNTUxOQAAACCM70BU7Zx+5fuBAFnNyojcD/lufxNYi48qd9+WuxNNbg
AAAEAp3Oq9z1mrBQ3k45h/KrjauZSjwOUz94QtTj9Pd6OCh4zvQFTtnH7l+4EAWc3KiNwP
+W5/E1iLjyp335a7E01uAAAAFmdpdGh1Yi1hY3Rpb25zLXNtb2thdmEBAgMEBQYH
-----END OPENSSH PRIVATE KEY-----
```

---

### Secret 2: SSH_HOST

**Name:** `SSH_HOST`

**Value:**
```
root@91.107.241.245
```

---

### Secret 3: API_URL

**Name:** `API_URL`

**Value:**
```
https://api.smokava.com
```

---

## ✅ After Adding Secrets

Once all 3 secrets are added:

1. **Test the deployment:**
   ```bash
   ./scripts/push-to-git.sh "test: Test automatic deployment"
   ```

2. **Check GitHub Actions:**
   - Go to: https://github.com/Baileysgin/Smokava/actions
   - You should see "Deploy to Production" workflow running

3. **Verify deployment:**
   - Check server: `ssh root@91.107.241.245 "cd /opt/smokava && docker-compose ps"`
   - Check health: `curl https://api.smokava.com/api/health`

## 🎉 That's It!

After adding these 3 secrets, every push to `main` will automatically deploy to your server!

---

## 📝 Quick Reference

**GitHub Secrets URL:**
https://github.com/Baileysgin/Smokava/settings/secrets/actions

**Server:** root@91.107.241.245
**API URL:** https://api.smokava.com

