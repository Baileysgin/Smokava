# ⚡ ADD GITHUB SECRETS NOW - Quick Action

## 🎯 One-Time Setup (Takes 2 minutes)

### Step 1: Go to GitHub Secrets Page

**Click this link:** https://github.com/Baileysgin/Smokava/settings/secrets/actions

### Step 2: Add 3 Secrets

Click **"New repository secret"** for each:

---

#### Secret 1: SSH_PRIVATE_KEY

1. **Name:** `SSH_PRIVATE_KEY`
2. **Value:** Copy and paste this entire block:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCM70BU7Zx+5fuBAFnNyojcD/lufxNYi48qd9+WuxNNbgAAAKCvfvpXr376
VwAAAAtzc2gtZWQyNTUxOQAAACCM70BU7Zx+5fuBAFnNyojcD/lufxNYi48qd9+WuxNNbg
AAAEAp3Oq9z1mrBQ3k45h/KrjauZSjwOUz94QtTj9Pd6OCh4zvQFTtnH7l+4EAWc3KiNwP
+W5/E1iLjyp335a7E01uAAAAFmdpdGh1Yi1hY3Rpb25zLXNtb2thdmEBAgMEBQYH
-----END OPENSSH PRIVATE KEY-----
```

3. Click **"Add secret"**

---

#### Secret 2: SSH_HOST

1. **Name:** `SSH_HOST`
2. **Value:**
```
root@91.107.241.245
```
3. Click **"Add secret"**

---

#### Secret 3: API_URL

1. **Name:** `API_URL`
2. **Value:**
```
https://api.smokava.com
```
3. Click **"Add secret"**

---

## ✅ Done!

After adding all 3 secrets, automatic deployment is enabled!

### Test It:

```bash
./scripts/push-to-git.sh "test: Test automatic deployment"
```

Then check: https://github.com/Baileysgin/Smokava/actions

---

## 📋 Quick Links

- **Add Secrets:** https://github.com/Baileysgin/Smokava/settings/secrets/actions
- **View Actions:** https://github.com/Baileysgin/Smokava/actions
- **Repository:** https://github.com/Baileysgin/Smokava

---

**That's it! Once you add these 3 secrets, every push will automatically deploy.** 🚀
