# 🚀 Manual Deployment Steps

Since SSH requires authentication, here are the steps to deploy manually:

## Step 1: Connect to Your Server

```bash
ssh root@91.107.241.245
```

(You'll need to enter your password or use SSH key)

## Step 2: Run the Fix Script

Once connected to the server, run:

```bash
cd /opt/smokava
git pull
sudo bash scripts/fix-production-502.sh
```

## Step 3: Verify Deployment

After the script completes, test:

```bash
# Test API
curl -I https://api.smokava.com/api/health

# Test Frontend
curl -I https://smokava.com

# Test Admin Panel
curl -I https://admin.smokava.com
```

## Alternative: One-Line Command

If you have SSH key configured, you can run from your local machine:

```bash
ssh -i ~/.ssh/your_key root@91.107.241.245 "cd /opt/smokava && git pull && sudo bash scripts/fix-production-502.sh"
```

## What the Script Does

1. ✅ Pulls latest code from GitHub
2. ✅ Fixes port mapping (5001→5000) in docker-compose.yml
3. ✅ Restarts backend container
4. ✅ Tests all services locally
5. ✅ Reloads nginx
6. ✅ Tests production URLs

## Expected Results

- Backend responds on `localhost:5000`
- All production URLs return 200 (not 502)
- Services are accessible via nginx

## If You Get Errors

Check container status:
```bash
docker compose ps
```

Check logs:
```bash
docker compose logs backend
docker compose logs frontend
docker compose logs admin-panel
```

Check nginx:
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

