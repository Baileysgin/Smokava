#!/bin/bash

# Script to check server connection and verify deployment readiness

set -e

echo "🔍 Checking Server Connection..."
echo ""

# Server details
SERVER="${SSH_HOST:-root@91.107.241.245}"
REMOTE_DIR="/opt/smokava"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# SSH command with optional password
SSH_PASS="${SSH_PASSWORD:-}"
SSH_CMD="ssh"
if [ -n "$SSH_PASS" ] && command -v sshpass > /dev/null 2>&1; then
    SSH_CMD="sshpass -p '$SSH_PASS' ssh"
fi

# Check 1: SSH Connection
echo -e "${YELLOW}1. Testing SSH connection...${NC}"
if $SSH_CMD -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SERVER" "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}   ✅ SSH connection works${NC}"
else
    echo -e "${RED}   ❌ SSH connection failed${NC}"
    echo "   Check: SSH key, server address, firewall"
    exit 1
fi

# Check 2: Server directory exists
echo -e "${YELLOW}2. Checking project directory...${NC}"
if $SSH_CMD "$SERVER" "test -d $REMOTE_DIR" 2>/dev/null; then
    echo -e "${GREEN}   ✅ Project directory exists: $REMOTE_DIR${NC}"
else
    echo -e "${RED}   ❌ Project directory not found${NC}"
    echo "   Run: ssh $SERVER 'mkdir -p $REMOTE_DIR && cd $REMOTE_DIR && git clone https://github.com/Baileysgin/Smokava.git .'"
    exit 1
fi

# Check 3: Git repository
echo -e "${YELLOW}3. Checking git repository...${NC}"
if $SSH_CMD "$SERVER" "cd $REMOTE_DIR && git status > /dev/null 2>&1"; then
    echo -e "${GREEN}   ✅ Git repository found${NC}"
    REMOTE_BRANCH=$($SSH_CMD "$SERVER" "cd $REMOTE_DIR && git rev-parse --abbrev-ref HEAD 2>/dev/null")
    echo "   Current branch: $REMOTE_BRANCH"
else
    echo -e "${RED}   ❌ Not a git repository${NC}"
    exit 1
fi

# Check 4: Docker and docker-compose
echo -e "${YELLOW}4. Checking Docker...${NC}"
if $SSH_CMD "$SERVER" "command -v docker > /dev/null 2>&1"; then
    DOCKER_VERSION=$($SSH_CMD "$SERVER" "docker --version" | head -1)
    echo -e "${GREEN}   ✅ Docker installed: $DOCKER_VERSION${NC}"
else
    echo -e "${RED}   ❌ Docker not installed${NC}"
    exit 1
fi

if $SSH_CMD "$SERVER" "command -v docker-compose > /dev/null 2>&1 || docker compose version > /dev/null 2>&1"; then
    echo -e "${GREEN}   ✅ Docker Compose available${NC}"
else
    echo -e "${RED}   ❌ Docker Compose not found${NC}"
    exit 1
fi

# Check 5: Compare local vs remote commits
echo -e "${YELLOW}5. Checking git sync status...${NC}"
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$($SSH_CMD "$SERVER" "cd $REMOTE_DIR && git rev-parse origin/main 2>/dev/null" || echo "")

if [ -z "$REMOTE_COMMIT" ]; then
    echo -e "${YELLOW}   ⚠️  Could not get remote commit${NC}"
else
    if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
        echo -e "${GREEN}   ✅ Local and remote are in sync${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Local and remote are out of sync${NC}"
        echo "   Local:  $LOCAL_COMMIT"
        echo "   Remote: $REMOTE_COMMIT"
    fi
fi

# Check 6: Services status
echo -e "${YELLOW}6. Checking services status...${NC}"
if $SSH_CMD "$SERVER" "cd $REMOTE_DIR && docker-compose ps 2>/dev/null | grep -q backend"; then
    echo -e "${GREEN}   ✅ Services are running${NC}"
    $SSH_CMD "$SERVER" "cd $REMOTE_DIR && docker-compose ps --format 'table {{.Name}}\t{{.Status}}' 2>/dev/null | head -5"
else
    echo -e "${YELLOW}   ⚠️  Services may not be running${NC}"
fi

echo ""
echo -e "${GREEN}✅ Server connection check complete!${NC}"
echo ""
echo "📋 Server Details:"
echo "   Server: $SERVER"
echo "   Directory: $REMOTE_DIR"
echo ""
echo "🚀 Ready for deployment!"

