#!/bin/bash

# HTTPS Setup Script for Smokava - Server Side
# Run this script on your production server
# Usage: sudo ./scripts/setup-https-server.sh

set -e

echo "🔒 HTTPS Setup for Smokava - Server Configuration"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root or with sudo${NC}"
    exit 1
fi

# Detect if nginx is in Docker or on host
NGINX_IN_DOCKER=false
if docker ps | grep -q nginx; then
    NGINX_IN_DOCKER=true
    echo -e "${BLUE}ℹ️  Nginx detected in Docker container${NC}"
else
    echo -e "${BLUE}ℹ️  Nginx detected on host system${NC}"
fi

# Step 1: Install Certbot
echo ""
echo "📦 Step 1: Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        yum install -y certbot python3-certbot-nginx
    else
        echo -e "${RED}❌ Could not detect package manager${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Certbot installed${NC}"
else
    echo -e "${GREEN}✅ Certbot already installed${NC}"
fi

# Step 2: Prepare webroot for Let's Encrypt
echo ""
echo "📁 Step 2: Preparing webroot directory..."
mkdir -p /var/www/certbot
if id "www-data" &>/dev/null; then
    chown -R www-data:www-data /var/www/certbot
elif id "nginx" &>/dev/null; then
    chown -R nginx:nginx /var/www/certbot
else
    chmod 755 /var/www/certbot
fi
echo -e "${GREEN}✅ Webroot directory ready${NC}"

# Step 3: Check if nginx is running
echo ""
echo "🔍 Step 3: Checking nginx status..."
if [ "$NGINX_IN_DOCKER" = true ]; then
    if docker ps | grep -q nginx; then
        echo -e "${GREEN}✅ Nginx container is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Nginx container not running. Make sure nginx is started.${NC}"
    fi
else
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Nginx is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Nginx is not running. Starting nginx...${NC}"
        systemctl start nginx || echo -e "${RED}❌ Failed to start nginx${NC}"
    fi
fi

# Step 4: Get email for Let's Encrypt
echo ""
read -p "📧 Enter email for Let's Encrypt notifications: " EMAIL
if [ -z "$EMAIL" ]; then
    echo -e "${RED}❌ Email is required${NC}"
    exit 1
fi

# Step 5: Obtain SSL certificates
echo ""
echo "🔐 Step 4: Obtaining SSL certificates..."
echo "This will get certificates for:"
echo "  - smokava.com and www.smokava.com"
echo "  - api.smokava.com"
echo "  - admin.smokava.com"
echo ""

read -p "Get certificates now? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${YELLOW}⚠️  Skipping certificate generation${NC}"
    echo "You can run this later with:"
    echo "  sudo certbot --nginx -d smokava.com -d www.smokava.com -d api.smokava.com -d admin.smokava.com"
    exit 0
fi

# Get certificates
certbot certonly --nginx \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    -d smokava.com \
    -d www.smokava.com \
    -d api.smokava.com \
    -d admin.smokava.com

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Certificates obtained successfully${NC}"
else
    echo -e "${RED}❌ Failed to obtain certificates${NC}"
    echo ""
    echo "Common issues:"
    echo "  1. Domain not pointing to this server"
    echo "  2. Port 80 not accessible"
    echo "  3. Nginx not properly configured"
    echo ""
    echo "Try running manually:"
    echo "  sudo certbot --nginx -d smokava.com -d www.smokava.com"
    exit 1
fi

# Step 6: Verify certificates
echo ""
echo "🔍 Step 5: Verifying certificates..."
if [ -f "/etc/letsencrypt/live/smokava.com/fullchain.pem" ]; then
    echo -e "${GREEN}✅ Certificates found at /etc/letsencrypt/live/${NC}"
    ls -la /etc/letsencrypt/live/
else
    echo -e "${RED}❌ Certificates not found${NC}"
    exit 1
fi

# Step 7: Update nginx configuration
echo ""
echo "⚙️  Step 6: Updating nginx configuration..."

# Find nginx config location
if [ "$NGINX_IN_DOCKER" = true ]; then
    echo -e "${YELLOW}⚠️  Nginx is in Docker. You need to:${NC}"
    echo "  1. Mount /etc/letsencrypt to nginx container"
    echo "  2. Update docker-compose.yml to include:"
    echo "     volumes:"
    echo "       - /etc/letsencrypt:/etc/letsencrypt:ro"
    echo "  3. Copy nginx config to container or mount it"
    echo ""
    echo "The nginx config file (nginx/smokava-docker.conf) is already configured for HTTPS."
    echo "Make sure it's mounted/copied to your nginx container."
else
    # Find nginx config
    NGINX_CONF="/etc/nginx/sites-available/smokava-docker.conf"
    if [ ! -f "$NGINX_CONF" ]; then
        NGINX_CONF="/etc/nginx/conf.d/smokava-docker.conf"
    fi

    if [ -f "$NGINX_CONF" ]; then
        echo -e "${GREEN}✅ Found nginx config at $NGINX_CONF${NC}"
        echo "The config should already have HTTPS blocks configured."
    else
        echo -e "${YELLOW}⚠️  Nginx config not found at standard locations${NC}"
        echo "Please ensure nginx/smokava-docker.conf is copied to your nginx config directory"
    fi
fi

# Step 8: Test nginx configuration
echo ""
echo "🧪 Step 7: Testing nginx configuration..."
if [ "$NGINX_IN_DOCKER" = true ]; then
    echo -e "${YELLOW}⚠️  Testing nginx in Docker...${NC}"
    NGINX_CONTAINER=$(docker ps | grep nginx | awk '{print $1}')
    if [ -n "$NGINX_CONTAINER" ]; then
        docker exec "$NGINX_CONTAINER" nginx -t
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
            echo "Reloading nginx container..."
            docker exec "$NGINX_CONTAINER" nginx -s reload || docker restart "$NGINX_CONTAINER"
        else
            echo -e "${RED}❌ Nginx configuration has errors${NC}"
        fi
    fi
else
    if nginx -t 2>/dev/null; then
        echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
        echo "Reloading nginx..."
        systemctl reload nginx
    else
        echo -e "${RED}❌ Nginx configuration has errors${NC}"
        echo "Please fix errors before continuing"
    fi
fi

# Step 9: Set up auto-renewal
echo ""
echo "🔄 Step 8: Setting up auto-renewal..."
systemctl enable certbot.timer 2>/dev/null || true
systemctl start certbot.timer 2>/dev/null || true

# Test renewal
echo "Testing certificate renewal (dry run)..."
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Auto-renewal test passed${NC}"
else
    echo -e "${YELLOW}⚠️  Auto-renewal test failed. Please check manually.${NC}"
fi

# Step 10: Verify HTTPS
echo ""
echo "✅ Step 9: Verifying HTTPS..."
echo ""
echo "Testing HTTPS endpoints:"
echo ""

DOMAINS=("smokava.com" "api.smokava.com" "admin.smokava.com")
for domain in "${DOMAINS[@]}"; do
    echo -n "  Testing https://$domain ... "
    if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://$domain" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
    fi
done

echo ""
echo -n "  Testing verification file https://smokava.com/28609673.txt ... "
if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://smokava.com/28609673.txt" | grep -q "200"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

# Summary
echo ""
echo "=================================================="
echo -e "${GREEN}✅ HTTPS Setup Complete!${NC}"
echo ""
echo "📋 Summary:"
echo "  ✅ Certbot installed"
echo "  ✅ SSL certificates obtained"
echo "  ✅ Auto-renewal configured"
echo ""
echo "🌐 Your sites should now be accessible via HTTPS:"
echo "  - https://smokava.com"
echo "  - https://api.smokava.com"
echo "  - https://admin.smokava.com"
echo ""
echo "📝 Next steps:"
echo "  1. Verify all domains work with HTTPS"
echo "  2. Test the verification file: curl -I https://smokava.com/28609673.txt"
echo "  3. Update environment variables to use HTTPS URLs"
echo ""
echo "📚 For troubleshooting, see: HTTPS_SETUP_INSTRUCTIONS.md"
echo ""

