#!/bin/bash

# HTTPS Setup Script for Smokava
# This script helps set up Let's Encrypt SSL certificates for all domains

set -e

echo "🔒 HTTPS Setup for Smokava"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root or with sudo${NC}"
    exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}⚠️  Certbot not found. Installing...${NC}"

    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        yum install -y certbot python3-certbot-nginx
    else
        echo -e "${RED}❌ Could not detect package manager. Please install certbot manually.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Certbot is installed${NC}"
echo ""

# Create certbot webroot directory
echo "📁 Creating webroot directory..."
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot 2>/dev/null || chown -R nginx:nginx /var/www/certbot 2>/dev/null
echo -e "${GREEN}✅ Webroot directory created${NC}"
echo ""

# Domains to get certificates for
DOMAINS=(
    "smokava.com www.smokava.com"
    "api.smokava.com"
    "admin.smokava.com"
)

echo "📋 Domains to configure:"
for domain in "${DOMAINS[@]}"; do
    echo "   - $domain"
done
echo ""

# Ask for email
read -p "📧 Enter email for Let's Encrypt notifications: " EMAIL

if [ -z "$EMAIL" ]; then
    echo -e "${RED}❌ Email is required${NC}"
    exit 1
fi

echo ""
echo "🔐 Obtaining SSL certificates..."
echo ""

# Option 1: Get certificates for all domains at once (if using same certificate)
read -p "Do you want to get a single certificate for all domains? (y/n): " SINGLE_CERT

if [ "$SINGLE_CERT" = "y" ] || [ "$SINGLE_CERT" = "Y" ]; then
    echo "Getting single certificate for all domains..."
    certbot certonly --nginx \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        -d smokava.com \
        -d www.smokava.com \
        -d api.smokava.com \
        -d admin.smokava.com

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Certificate obtained successfully${NC}"
        echo ""
        echo "⚠️  Note: You'll need to update nginx config to use the same certificate for all domains"
        echo "   Certificate path: /etc/letsencrypt/live/smokava.com/"
    else
        echo -e "${RED}❌ Failed to obtain certificate${NC}"
        exit 1
    fi
else
    # Option 2: Get separate certificates for each domain
    for domain_group in "${DOMAINS[@]}"; do
        echo "Getting certificate for: $domain_group"
        certbot certonly --nginx \
            --email "$EMAIL" \
            --agree-tos \
            --non-interactive \
            -d $domain_group

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Certificate obtained for $domain_group${NC}"
        else
            echo -e "${RED}❌ Failed to obtain certificate for $domain_group${NC}"
        fi
        echo ""
    done
fi

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
if nginx -t 2>/dev/null; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx configuration test failed. Please check manually:${NC}"
    echo "   sudo nginx -t"
fi
echo ""

# Set up auto-renewal
echo "🔄 Setting up auto-renewal..."
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
echo ""

# Summary
echo "=========================="
echo -e "${GREEN}✅ HTTPS Setup Complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Verify nginx configuration: sudo nginx -t"
echo "   2. Reload nginx: sudo systemctl reload nginx"
echo "   3. Test HTTPS: curl -I https://smokava.com"
echo "   4. Test verification file: curl -I https://smokava.com/28609673.txt"
echo ""
echo "📚 For more details, see: HTTPS_SETUP_INSTRUCTIONS.md"
echo ""



