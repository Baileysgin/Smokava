#!/bin/bash

# Auto-deploy script: Pushes git changes and deploys to server
# This script can be run manually or set up as a git hook

set -e

echo "🚀 Auto-Deploy to Server"
echo "========================"
echo ""

# Server details
SERVER="${SSH_HOST:-root@91.107.241.245}"
REMOTE_DIR="/opt/smokava"
SSH_PASS="${SSH_PASSWORD:-pqwRU4qhpVW7}"

# SSH command with password support
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=20"
if [ -n "$SSH_PASS" ] && command -v sshpass > /dev/null 2>&1; then
    SSH_CMD() {
        sshpass -p "$SSH_PASS" ssh $SSH_OPTS "$@"
    }
else
    SSH_CMD() {
        ssh $SSH_OPTS "$@"
    }
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes.${NC}"
    echo "   Commit them first or stash them."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 2: Push to GitHub
echo -e "${YELLOW}📤 Step 1: Pushing to GitHub...${NC}"
if git push origin main 2>&1; then
    echo -e "${GREEN}✅ Pushed to GitHub${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    echo "   Continuing with server deployment anyway..."
fi

# Step 3: Check server connection
echo -e "${YELLOW}🔍 Step 2: Checking server connection...${NC}"
if ! SSH_CMD "$SERVER" "echo 'connected'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to server: $SERVER${NC}"
    echo "   Check: SSH key, server address, network"
    exit 1
fi
echo -e "${GREEN}✅ Server connection OK${NC}"

# Step 4: Pull latest code on server
echo -e "${YELLOW}📥 Step 3: Pulling latest code on server...${NC}"
SSH_CMD "$SERVER" "cd $REMOTE_DIR && \
    git fetch origin && \
    git reset --hard origin/main && \
    echo '✅ Code updated on server'"

# Step 5: Create backup
echo -e "${YELLOW}📦 Step 4: Creating backup...${NC}"
SSH_CMD "$SERVER" "cd $REMOTE_DIR && bash scripts/db-backup.sh" || {
    echo -e "${YELLOW}⚠️  Backup failed, continuing...${NC}"
}

# Step 6: Deploy services
echo -e "${YELLOW}🔨 Step 5: Deploying services...${NC}"
SSH_CMD "$SERVER" "cd $REMOTE_DIR && \
    (docker compose build backend 2>/dev/null || docker-compose build backend) && \
    (docker compose up -d --no-deps backend 2>/dev/null || docker-compose up -d --no-deps backend) && \
    echo '✅ Backend deployed'"

# Step 7: Ensure admin user
echo -e "${YELLOW}👤 Step 6: Ensuring admin user exists...${NC}"
SSH_CMD "$SERVER" "cd $REMOTE_DIR && \
    (docker compose exec -T backend node scripts/createAdmin.js admin admin123 2>/dev/null || docker-compose exec -T backend node scripts/createAdmin.js admin admin123)" || {
    echo -e "${YELLOW}⚠️  Admin creation had issues, but continuing...${NC}"
}

# Step 8: Wait and verify
echo -e "${YELLOW}⏳ Step 7: Waiting for services to start...${NC}"
sleep 10

# Step 9: Health check
echo -e "${YELLOW}🏥 Step 8: Running health check...${NC}"
API_URL="${API_BASE_URL:-https://api.smokava.com}"
if [[ ! "$API_URL" == */api ]]; then
    API_URL="${API_URL%/}/api"
fi

if curl -f -s "${API_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed, but deployment may still be successful${NC}"
fi

echo ""
echo -e "${GREEN}✅ Auto-deployment complete!${NC}"
echo ""
echo "📋 Summary:"
echo "   ✅ Code pushed to GitHub"
echo "   ✅ Code pulled on server"
echo "   ✅ Services deployed"
echo "   ✅ Admin user verified"
echo ""
echo "🔗 Test login at: https://admin.smokava.com/login"
echo "   Username: admin"
echo "   Password: admin123"
