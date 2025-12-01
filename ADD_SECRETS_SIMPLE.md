# 🔑 Add GitHub Secrets - SIMPLEST WAY

## ⚡ 3 Steps (1 minute)

### Step 1: Get GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `Smokava Secrets`
4. Check **"repo"** scope (Full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token** (you'll only see it once!)

### Step 2: Run the Script

```bash
export GITHUB_TOKEN=your_token_here
./scripts/add-secrets-via-api.sh
```

### Step 3: Re-run Workflow

1. Go to: https://github.com/Baileysgin/Smokava/actions
2. Click **"Re-run jobs"**
3. ✅ Done!

---

## OR: Manual Method (2 minutes)

If you prefer to add manually:

1. **Open**: https://github.com/Baileysgin/Smokava/settings/secrets/actions

2. **Add SSH_PRIVATE_KEY**:
   - Click "New repository secret"
   - Name: `SSH_PRIVATE_KEY`
   - Value: Copy from `ADD_SECRETS_NOW.md`
   - Click "Add secret"

3. **Add SSH_HOST**:
   - Click "New repository secret"
   - Name: `SSH_HOST`
   - Value: `root@91.107.241.245`
   - Click "Add secret"

4. **Re-run workflow**: https://github.com/Baileysgin/Smokava/actions

---

## ✅ That's it!

After adding secrets, the deployment will work automatically!
