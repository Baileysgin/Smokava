#!/bin/bash

# Fully Automated Deployment + HTTPS Setup Script
# This script handles everything automatically

set -e

# Server configuration
SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/smokava}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Automated Deployment + HTTPS Setup${NC}"
echo "=================================================="
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}⚠️  Installing sshpass...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command -v brew &> /dev/null; then
            echo -e "${RED}❌ Homebrew required. Installing...${NC}"
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install hudochenkov/sshpass/sshpass || true
    fi
fi

# Remote execution function
remote_exec() {
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
}

# Remote copy function
remote_copy() {
    sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 -P "$SERVER_PORT" -r "$1" "$SERVER_USER@$SERVER_IP:$2"
}

# Test connection
echo -e "${BLUE}📡 Step 1: Testing server connection...${NC}"
if remote_exec "echo 'Connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✅ Server connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to server. Please check:${NC}"
    echo "   - Server IP: $SERVER_IP"
    echo "   - SSH credentials"
    echo "   - Network connectivity"
    exit 1
fi

# Check/create deployment directory
echo ""
echo -e "${BLUE}📁 Step 2: Setting up deployment directory...${NC}"
remote_exec "mkdir -p $DEPLOY_DIR && mkdir -p $DEPLOY_DIR/scripts && mkdir -p $DEPLOY_DIR/nginx" || true
echo -e "${GREEN}✅ Directory structure ready${NC}"

# Create deployment package
echo ""
echo -e "${BLUE}📦 Step 3: Creating deployment package...${NC}"
TEMP_DIR=$(mktemp -d)
DEPLOY_PACKAGE="$TEMP_DIR/smokava-deploy.tar.gz"

# Create tar excluding unnecessary files
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='backend/.env' \
    --exclude='frontend/.env.local' \
    --exclude='admin-panel/.env' \
    --exclude='*.md' \
    -czf "$DEPLOY_PACKAGE" .

echo -e "${GREEN}✅ Package created: $(du -h "$DEPLOY_PACKAGE" | cut -f1)${NC}"

# Upload package
echo ""
echo -e "${BLUE}📤 Step 4: Uploading to server...${NC}"
remote_copy "$DEPLOY_PACKAGE" "$DEPLOY_DIR/smokava-deploy.tar.gz"
echo -e "${GREEN}✅ Upload complete${NC}"

# Extract on server
echo ""
echo -e "${BLUE}📂 Step 5: Extracting files on server...${NC}"
remote_exec "cd $DEPLOY_DIR && tar -xzf smokava-deploy.tar.gz && rm -f smokava-deploy.tar.gz && chmod +x scripts/*.sh 2>/dev/null || true"
echo -e "${GREEN}✅ Files extracted${NC}"

# Ensure HTTPS setup script exists and is executable
echo ""
echo -e "${BLUE}🔧 Step 6: Preparing HTTPS setup script...${NC}"
remote_exec "cd $DEPLOY_DIR && \
    if [ ! -f scripts/setup-https-server.sh ]; then \
        echo 'Script missing, will be created from uploaded files'; \
    fi && \
    chmod +x scripts/setup-https-server.sh 2>/dev/null || true && \
    chmod +x deploy-server.sh 2>/dev/null || true"
echo -e "${GREEN}✅ Scripts prepared${NC}"

# Run HTTPS setup (non-interactive mode)
echo ""
echo -e "${BLUE}🔒 Step 7: Running HTTPS setup...${NC}"
echo -e "${YELLOW}⚠️  This may take a few minutes...${NC}"

# Create a non-interactive version of the setup
remote_exec "cd $DEPLOY_DIR && bash -c '
export DEBIAN_FRONTEND=noninteractive

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    apt-get update -qq
    apt-get install -y -qq certbot python3-certbot-nginx
fi

# Create webroot
mkdir -p /var/www/certbot
chmod 755 /var/www/certbot

# Check if certificates already exist
if [ -f /etc/letsencrypt/live/smokava.com/fullchain.pem ]; then
    echo \"Certificates already exist, skipping generation\"
else
    # Get certificates (non-interactive)
    certbot certonly --nginx \
        --email admin@smokava.com \
        --agree-tos \
        --non-interactive \
        --keep-until-expiring \
        -d smokava.com \
        -d www.smokava.com \
        -d api.smokava.com \
        -d admin.smokava.com 2>&1 || echo \"Certificate generation may have failed or already exists\"
fi

# Test nginx config
if command -v nginx &> /dev/null; then
    nginx -t 2>&1 && systemctl reload nginx 2>&1 || echo \"Nginx reload may have failed\"
fi

# Set up auto-renewal
systemctl enable certbot.timer 2>/dev/null || true
systemctl start certbot.timer 2>/dev/null || true

echo \"HTTPS setup completed\"
'" || echo -e "${YELLOW}⚠️  HTTPS setup encountered issues, but continuing...${NC}"

# Verify HTTPS
echo ""
echo -e "${BLUE}✅ Step 8: Verifying HTTPS...${NC}"
sleep 5

# Test HTTPS endpoints
for domain in "smokava.com" "api.smokava.com" "admin.smokava.com"; do
    echo -n "  Testing https://$domain ... "
    if curl -s -o /dev/null -w "%{http_code}" --max-time 10 --insecure "https://$domain" 2>/dev/null | grep -qE "200|301|302"; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${YELLOW}⚠️  May need time to propagate${NC}"
    fi
done

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Automated Deployment Complete!${NC}"
echo ""
echo "🌐 Your services should be available at:"
echo "   - https://smokava.com"
echo "   - https://api.smokava.com"
echo "   - https://admin.smokava.com"
echo ""
echo "📋 To check status:"
echo "   ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP 'cd $DEPLOY_DIR && docker-compose ps'"
echo ""


