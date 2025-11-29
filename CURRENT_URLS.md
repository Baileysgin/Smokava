# 🌐 Current Smokava URLs

## ✅ Currently Working URLs (Direct IP Access)

Your services are running via Docker and are accessible directly via IP:

### **User Application (Frontend)**
```
http://91.107.241.245:3000
```

### **Backend API**
```
http://91.107.241.245:5000
http://91.107.241.245:5000/api
```

### **Admin Panel**
```
http://91.107.241.245:5173
http://91.107.241.245:5173/login
```

### **Operator Panel**
```
http://91.107.241.245:5173/operator/login
http://91.107.241.245:5173/operator
```

## ❌ Why smokava.com is Not Working

**Issue**: Nginx is not installed/configured for domain routing.

Currently:
- ✅ Services are running via Docker on direct ports
- ❌ Nginx reverse proxy is NOT set up
- ❌ Domain DNS may not be pointing to server
- ❌ SSL certificates are NOT installed

## 🔧 To Fix Domain Access (smokava.com)

### Step 1: Install Nginx

```bash
ssh root@91.107.241.245
apt-get update
apt-get install -y nginx
```

### Step 2: Configure DNS

Point your domain to the server IP:

```
A     @                   91.107.241.245
A     www                 91.107.241.245
A     api                 91.107.241.245
A     admin               91.107.241.245
```

### Step 3: Setup Nginx Configuration

```bash
# On server
cd /opt/smokava
sudo cp nginx/smokava.conf /etc/nginx/sites-available/smokava

# Update domain names in config
sudo nano /etc/nginx/sites-available/smokava
# Replace "mydomain.com" with "smokava.com"

# Enable site
sudo ln -s /etc/nginx/sites-available/smokava /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default if exists

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 4: Install SSL Certificates

```bash
# Install certbot
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificates
sudo certbot --nginx -d smokava.com -d www.smokava.com
sudo certbot --nginx -d api.smokava.com
sudo certbot --nginx -d admin.smokava.com
```

### Step 5: Update Nginx Config for Docker

Since you're using Docker, update the nginx config to proxy to Docker containers:

```nginx
# In /etc/nginx/sites-available/smokava

# API Backend
location /api {
    proxy_pass http://localhost:5000;
    # ... rest of proxy config
}

# Frontend (if using standalone Next.js)
location / {
    proxy_pass http://localhost:3000;
    # ... rest of proxy config
}

# Admin Panel
location / {
    proxy_pass http://localhost:5173;
    # ... rest of proxy config
}
```

## 🚀 Quick Fix: Use Direct IP URLs

For now, you can use these URLs directly:

- **User App**: http://91.107.241.245:3000
- **API**: http://91.107.241.245:5000/api
- **Admin**: http://91.107.241.245:5173
- **Operator**: http://91.107.241.245:5173/operator/login

## 📋 After Nginx Setup, URLs Will Be:

- **User App**: https://smokava.com
- **API**: https://api.smokava.com
- **Admin**: https://admin.smokava.com
- **Operator**: https://admin.smokava.com/operator/login

## 🔍 Verify Current Status

```bash
# Check if services are running
docker compose ps

# Check if ports are open
netstat -tulpn | grep -E ":(80|443|3000|5000|5173)"

# Test backend
curl http://localhost:5000/

# Check DNS
dig +short smokava.com
```

