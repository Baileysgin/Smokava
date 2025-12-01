# 🔐 HOW TO ADD GITHUB SECRETS - STEP-BY-STEP GUIDE

## ⚠️ CRITICAL: Required Secrets

Your deployment **WILL FAIL** without these two secrets:
1. **SSH_PRIVATE_KEY** - Your SSH private key
2. **SERVER_IP** - Your server IP address (91.107.241.245)

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### Step 1: Navigate to GitHub Secrets

1. Go to your repository: https://github.com/Baileysgin/Smokava
2. Click on **Settings** (top menu bar)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. You should see: https://github.com/Baileysgin/Smokava/settings/secrets/actions

---

### Step 2: Add SSH_PRIVATE_KEY Secret

1. Click **"New repository secret"** button (top right)
2. **Name:** `SSH_PRIVATE_KEY`
3. **Value:** Your full SSH private key content

   **How to get your SSH private key:**
   
   ```bash
   # On your local machine, run:
   cat ~/.ssh/github_actions_smokava
   # OR if you have a different key:
   cat ~/.ssh/id_rsa
   # OR if you use ed25519:
   cat ~/.ssh/id_ed25519
   ```
   
   **Important:** Copy the ENTIRE key, including:
   - `-----BEGIN OPENSSH PRIVATE KEY-----` (or `-----BEGIN RSA PRIVATE KEY-----`)
   - All the key content in the middle
   - `-----END OPENSSH PRIVATE KEY-----` (or `-----END RSA PRIVATE KEY-----`)

4. Click **"Add secret"**

---

### Step 3: Add SERVER_IP Secret

1. Click **"New repository secret"** button again
2. **Name:** `SERVER_IP`
3. **Value:** `91.107.241.245`
4. Click **"Add secret"**

---

### Step 4: (Optional) Add Other Secrets

These are optional but recommended:

#### SSH_USER (Optional)
- **Name:** `SSH_USER`
- **Value:** `root`
- **Note:** Defaults to 'root' if not set

#### SSH_PORT (Optional)
- **Name:** `SSH_PORT`
- **Value:** `22`
- **Note:** Defaults to '22' if not set

#### API_URL (Optional)
- **Name:** `API_URL`
- **Value:** `https://api.smokava.com`
- **Note:** Used for health checks, defaults to this value if not set

---

## ✅ VERIFICATION

After adding secrets, verify they exist:

1. Go to: https://github.com/Baileysgin/Smokava/settings/secrets/actions
2. You should see at minimum:
   - ✅ **SSH_PRIVATE_KEY** (shows as ••••••••••)
   - ✅ **SERVER_IP** (shows as ••••••••••)

---

## 🚀 TEST THE DEPLOYMENT

After adding secrets:

1. Go to: https://github.com/Baileysgin/Smokava/actions
2. Find the failed workflow run
3. Click **"Re-run jobs"** → **"Re-run failed jobs"**
4. The workflow should now pass the secret validation step!

---

## 🆘 TROUBLESHOOTING

### "SSH_PRIVATE_KEY is missing"
- **Solution:** Make sure you copied the ENTIRE key including BEGIN and END lines
- **Check:** The secret name is exactly `SSH_PRIVATE_KEY` (case-sensitive)

### "SERVER_IP is missing"
- **Solution:** Add secret with name `SERVER_IP` and value `91.107.241.245`
- **Check:** No extra spaces or characters

### "SSH connection failed" (after adding secrets)
- **Solution:** Verify your SSH key is correct and has access to the server
- **Test manually:** `ssh -i ~/.ssh/your_key root@91.107.241.245`

### "Permission denied" errors
- **Solution:** Make sure the SSH key is added to the server's authorized_keys
- **Check:** `cat ~/.ssh/authorized_keys` on the server should contain your public key

---

## 📝 QUICK REFERENCE

**Minimum Required Secrets:**
```
SSH_PRIVATE_KEY = [Your full SSH private key]
SERVER_IP = 91.107.241.245
```

**Recommended Additional Secrets:**
```
SSH_USER = root
SSH_PORT = 22
API_URL = https://api.smokava.com
```

---

## 🎯 NEXT STEPS

1. ✅ Add SSH_PRIVATE_KEY secret
2. ✅ Add SERVER_IP secret
3. ✅ Re-run the failed workflow
4. ✅ Monitor deployment at: https://github.com/Baileysgin/Smokava/actions

**After adding secrets, your deployment will work! 🚀**

