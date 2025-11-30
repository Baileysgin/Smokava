# CI/CD Setup Guide for Smokava

This guide explains how to set up automated deployment using GitHub Actions.

## 📋 Prerequisites

1. Ubuntu server (IP: 91.107.241.245)
2. Domain name configured to point to server
3. GitHub repository with Actions enabled
4. SSH access to server

## 🔧 Part 1: Server Setup

### 1.1 Initial Server Configuration

Run the setup script on your server:

```bash
# SSH into server
ssh root@91.107.241.245

# Clone repository
cd /opt
git clone <your-repo-url> smokava
cd smokava

# Run setup script
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh
```

### 1.2 Configure Environment Variables

```bash
cd /opt/smokava

# Create backend .env
cp env.example backend/.env
nano backend/.env
# Update with your actual values:
# - MONGODB_URI
# - JWT_SECRET (generate strong secret)
# - KAVENEGAR_API_KEY
# - FRONTEND_URL, ADMIN_PANEL_URL, OPERATOR_PANEL_URL
# - ALLOWED_ORIGINS

# Create frontend .env.production
cat > frontend/.env.production << EOF
NEXT_PUBLIC_API_URL=https://api.mydomain.com/api
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
EOF

# Create admin-panel .env.production
cat > admin-panel/.env.production << EOF
VITE_API_URL=https://api.mydomain.com/api
EOF
```

### 1.3 Setup Nginx

```bash
# Copy nginx config
sudo cp nginx/smokava.conf /etc/nginx/sites-available/smokava

# Update domain names in config
sudo nano /etc/nginx/sites-available/smokava
# Replace mydomain.com with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/smokava /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 1.4 Setup SSL Certificates

```bash
# Get SSL certificates for all domains
sudo certbot --nginx -d mydomain.com -d www.mydomain.com
sudo certbot --nginx -d api.mydomain.com
sudo certbot --nginx -d admin.mydomain.com
# Note: Operator panel uses same domain as admin panel

# Certbot will automatically update nginx config
# Verify: sudo nginx -t && sudo systemctl reload nginx
```

### 1.5 Initial Deployment

```bash
cd /opt/smokava

# Install dependencies
cd backend && npm ci --production && cd ..
cd frontend && npm ci && npm run build && cd ..
cd admin-panel && npm ci && npm run build && cd ..

# Copy builds to web directories
sudo cp -r frontend/.next/standalone/* /var/www/smokava-frontend/
sudo cp -r frontend/.next/static /var/www/smokava-frontend/.next/
sudo cp -r frontend/public /var/www/smokava-frontend/

sudo cp -r admin-panel/dist/* /var/www/smokava-admin-panel/

# Set permissions
sudo chown -R www-data:www-data /var/www/smokava-frontend
sudo chown -R www-data:www-data /var/www/smokava-admin-panel

# Start backend with PM2
pm2 start ecosystem.config.js
pm2 save
```

## 🔐 Part 2: GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

### Required Secrets

1. **SERVER_IP**: `91.107.241.245`
2. **SSH_USER**: `root` (or your SSH user)
3. **SSH_PRIVATE_KEY**: Your private SSH key (entire content including `-----BEGIN RSA PRIVATE KEY-----`)
4. **SSH_PORT**: `22` (optional, defaults to 22)

### Environment Variables

5. **NEXT_PUBLIC_API_URL**: `https://api.mydomain.com/api`
6. **NEXT_PUBLIC_MAPBOX_TOKEN**: Your Mapbox token
7. **VITE_API_URL**: `https://api.mydomain.com/api`

### Backend Secrets (for env sync)

8. **JWT_SECRET**: Your JWT secret
9. **MONGODB_URI**: Your MongoDB connection string
10. **KAVENEGAR_API_KEY**: Your Kavenegar API key
11. **KAVENEGAR_TEMPLATE**: Your Kavenegar template name

### How to Generate SSH Key Pair

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions_smokava

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_smokava.pub root@91.107.241.245

# Copy private key content to GitHub Secrets
cat ~/.ssh/github_actions_smokava
# Copy entire output including BEGIN/END lines to SSH_PRIVATE_KEY secret
```

## 🚀 Part 3: GitHub Actions Workflows

The following workflows are already configured:

### 3.1 Backend Deployment (`deploy-backend.yml`)

Triggers on:
- Push to `main` branch with changes in `backend/**`
- Manual trigger (workflow_dispatch)

Actions:
1. Checks out code
2. Installs dependencies
3. SSHs to server
4. Pulls latest code
5. Installs production dependencies
6. Restarts PM2 process

### 3.2 Frontend Deployment (`deploy-frontend.yml`)

Triggers on:
- Push to `main` branch with changes in `frontend/**`
- Manual trigger

Actions:
1. Checks out code
2. Installs dependencies
3. Builds Next.js app with production env vars
4. Uploads build to server
5. Moves build to `/var/www/smokava-frontend`
6. Reloads Nginx

### 3.3 Admin Panel Deployment (`deploy-admin-panel.yml`)

Triggers on:
- Push to `main` branch with changes in `admin-panel/**`
- Manual trigger

Actions:
1. Checks out code
2. Installs dependencies
3. Builds Vite app with production env vars
4. Uploads build to server
5. Moves build to `/var/www/smokava-admin-panel`
6. Reloads Nginx

### 3.4 Environment Sync (`sync-env.yml`)

Triggers on:
- Manual trigger (workflow_dispatch)
- Push to `main` with changes to `env.example`

Actions:
1. Syncs environment files to server
2. Preserves existing values
3. Creates missing .env files from examples

## 📝 Part 4: Domain Configuration

### DNS Records

Configure your DNS to point to the server:

```
A     @                   91.107.241.245
A     www                 91.107.241.245
A     api                 91.107.241.245
A     admin               91.107.241.245
A     operator            91.107.241.245  (optional, can use admin subdomain)
```

### Nginx Configuration

The nginx config routes:
- `mydomain.com` → User application (Next.js)
- `api.mydomain.com` → Backend API (Node.js/Express)
- `admin.mydomain.com` → Admin Panel (Vite/React)
- `operator.mydomain.com` → Operator Panel (same as admin, different route)

## 🔄 Part 5: Deployment Flow

### Automatic Deployment

1. **Developer pushes code to `main` branch**
2. **GitHub Actions detects changes**
3. **Workflow runs based on changed paths:**
   - `backend/**` → Deploys backend
   - `frontend/**` → Deploys frontend
   - `admin-panel/**` → Deploys admin panel
4. **Server receives updates:**
   - Code is pulled
   - Dependencies installed
   - Builds are created
   - Services are restarted
   - Nginx is reloaded

### Manual Deployment

You can manually trigger any workflow:
1. Go to Actions tab in GitHub
2. Select workflow
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow"

## 🧪 Part 6: Testing Deployment

### Verify Backend

```bash
curl https://api.mydomain.com/
# Should return: {"message":"Smokava API Server is running",...}
```

### Verify Frontend

```bash
curl -I https://mydomain.com
# Should return 200 OK
```

### Verify Admin Panel

```bash
curl -I https://admin.mydomain.com
# Should return 200 OK
```

### Check PM2 Status

```bash
ssh root@91.107.241.245
pm2 status
pm2 logs smokava-backend
```

## 🐛 Troubleshooting

### Backend not starting

```bash
# Check PM2 logs
pm2 logs smokava-backend

# Check if .env file exists
ls -la /opt/smokava/backend/.env

# Restart manually
pm2 restart smokava-backend
```

### Frontend build fails

```bash
# Check GitHub Actions logs
# Verify NEXT_PUBLIC_API_URL is set correctly
# Check build output for errors
```

### Nginx errors

```bash
# Test nginx config
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Reload nginx
sudo systemctl reload nginx
```

### Environment variables not loading

```bash
# Verify .env files exist
ls -la /opt/smokava/backend/.env
ls -la /opt/smokava/frontend/.env.production
ls -la /opt/smokava/admin-panel/.env.production

# Check if variables are set
cd /opt/smokava/backend
node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET)"
```

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Let's Encrypt/Certbot](https://certbot.eff.org/)

## ✅ Checklist

- [ ] Server setup script run
- [ ] Environment variables configured
- [ ] Nginx configured and tested
- [ ] SSL certificates installed
- [ ] GitHub Secrets configured
- [ ] SSH key pair generated and added
- [ ] Initial deployment successful
- [ ] All domains accessible
- [ ] CI/CD workflows tested
- [ ] Monitoring/logging set up



