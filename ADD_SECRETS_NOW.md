# 🔑 Add GitHub Secrets NOW - Copy & Paste

## ⚡ Quick Setup (2 minutes)

### Step 1: Add SSH_PRIVATE_KEY

1. **Open**: https://github.com/Baileysgin/Smokava/settings/secrets/actions
2. **Click**: "New repository secret"
3. **Name**: `SSH_PRIVATE_KEY`
4. **Value**: Copy the ENTIRE private key below:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCM70BU7Zx+5fuBAFnNyojcD/lufxNYi48qd9+WuxNNbgAAAKCvfvpXr376
VwAAAAtzc2gtZWQyNTUxOQAAACCM70BU7Zx+5fuBAFnNyojcD/lufxNYi48qd9+WuxNNbg
AAAEAp3Oq9z1mrBQ3k45h/KrjauZSjwOUz94QtTj9Pd6OCh4zvQFTtnH7l+4EAWc3KiNwP
+W5/E1iLjyp335a7E01uAAAAFmdpdGh1Yi1hY3Rpb25zLXNtb2thdmEBAgMEBQYH
-----END OPENSSH PRIVATE KEY-----
```

5. **Click**: "Add secret"

### Step 2: Add SSH_HOST

1. **Click**: "New repository secret" (again)
2. **Name**: `SSH_HOST`
3. **Value**: `root@91.107.241.245`
4. **Click**: "Add secret"

### Step 3: Verify Public Key is on Server

Run this to ensure the public key is on your server:

```bash
cat ~/.ssh/github_actions_smokava.pub | ssh root@91.107.241.245 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Step 4: Trigger Deployment

After adding both secrets:

1. Go to: https://github.com/Baileysgin/Smokava/actions
2. Click "Re-run jobs" on the failed workflow
3. ✅ Deployment will start automatically!

## ✅ Checklist

- [ ] SSH_PRIVATE_KEY added to GitHub
- [ ] SSH_HOST added to GitHub
- [ ] Public key added to server
- [ ] Re-run the failed workflow

## 🚀 That's it!

The deployment will automatically:
- Connect to server via SSH
- Pull latest code
- Rebuild admin panel
- Deploy all services
- Run health checks
