#!/bin/bash

# ===========================================
# SMOKAVA - NGINX SETUP SCRIPT
# ===========================================
# This script sets up Nginx reverse proxy for Smokava

set -e

DOMAIN="${1:-smokava.com}"
SERVER_IP="${2:-91.107.241.245}"

echo "🚀 Setting up Nginx for $DOMAIN..."

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt-get update
    apt-get install -y nginx
else
    echo "✅ Nginx is already installed"
fi

# Create nginx config directory if it doesn't exist
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# Copy nginx config
if [ -f /opt/smokava/nginx/smokava.conf ]; then
    echo "📝 Copying Nginx configuration..."
    cp /opt/smokava/nginx/smokava.conf /etc/nginx/sites-available/smokava
else
    echo "❌ Nginx config file not found at /opt/smokava/nginx/smokava.conf"
    exit 1
fi

# Update domain names in config
echo "🔧 Updating domain names to $DOMAIN..."
sed -i "s/mydomain.com/$DOMAIN/g" /etc/nginx/sites-available/smokava
sed -i "s/api.mydomain.com/api.$DOMAIN/g" /etc/nginx/sites-available/smokava
sed -i "s/admin.mydomain.com/admin.$DOMAIN/g" /etc/nginx/sites-available/smokava
sed -i "s/operator.mydomain.com/operator.$DOMAIN/g" /etc/nginx/sites-available/smokava

# Update SSL certificate paths (will be updated by certbot later)
sed -i "s|/etc/letsencrypt/live/api.mydomain.com|/etc/letsencrypt/live/api.$DOMAIN|g" /etc/nginx/sites-available/smokava
sed -i "s|/etc/letsencrypt/live/mydomain.com|/etc/letsencrypt/live/$DOMAIN|g" /etc/nginx/sites-available/smokava
sed -i "s|/etc/letsencrypt/live/admin.mydomain.com|/etc/letsencrypt/live/admin.$DOMAIN|g" /etc/nginx/sites-available/smokava

# Create HTTP-only version for initial setup (before SSL)
echo "📝 Creating HTTP-only configuration..."
cat > /etc/nginx/sites-available/smokava-http << 'NGINX_HTTP'
# HTTP-only configuration (before SSL setup)
# API Backend
server {
    listen 80;
    server_name api.smokava.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# User Application
server {
    listen 80;
    server_name smokava.com www.smokava.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Panel
server {
    listen 80;
    server_name admin.smokava.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_HTTP

# Update domain in HTTP config
sed -i "s/smokava.com/$DOMAIN/g" /etc/nginx/sites-available/smokava-http

# Remove default nginx site
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Enable HTTP config first (before SSL)
if [ -L /etc/nginx/sites-enabled/smokava ]; then
    rm /etc/nginx/sites-enabled/smokava
fi
ln -sf /etc/nginx/sites-available/smokava-http /etc/nginx/sites-enabled/smokava

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed!"
    exit 1
fi

# Reload nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx || systemctl restart nginx

echo ""
echo "✅ Nginx setup complete!"
echo ""
echo "📋 Current configuration:"
echo "   - API: http://api.$DOMAIN → http://localhost:5000"
echo "   - Frontend: http://$DOMAIN → http://localhost:3000"
echo "   - Admin: http://admin.$DOMAIN → http://localhost:5173"
echo ""
echo "🔐 Next steps for SSL:"
echo "   1. Make sure DNS is pointing to $SERVER_IP"
echo "   2. Install certbot: apt-get install -y certbot python3-certbot-nginx"
echo "   3. Get certificates: certbot --nginx -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN -d admin.$DOMAIN"
echo "   4. Certbot will automatically update to HTTPS config"
echo ""
echo "🌐 Test URLs (HTTP):"
echo "   - http://$DOMAIN"
echo "   - http://api.$DOMAIN"
echo "   - http://admin.$DOMAIN"


