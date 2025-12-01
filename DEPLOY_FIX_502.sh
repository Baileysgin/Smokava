#!/bin/bash

# One-Command Fix for 502 Bad Gateway
# Run this on your server: sudo bash DEPLOY_FIX_502.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Fixing 502 Bad Gateway Error       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run with sudo${NC}"
    exit 1
fi

PROJECT_DIR="${PROJECT_DIR:-/opt/smokava}"
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
    exit 1
}

# Determine docker compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}❌ Docker Compose not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Pulling latest code...${NC}"
git pull origin main || git pull origin master || echo -e "${YELLOW}⚠ Could not pull code${NC}"

echo -e "\n${YELLOW}🛑 Stopping admin-panel...${NC}"
$DOCKER_COMPOSE_CMD stop admin-panel 2>/dev/null || true
docker rm -f smokava-admin-panel 2>/dev/null || true

echo -e "\n${YELLOW}🔨 Rebuilding admin-panel...${NC}"
$DOCKER_COMPOSE_CMD build --no-cache admin-panel || $DOCKER_COMPOSE_CMD build admin-panel

echo -e "\n${YELLOW}🚀 Starting admin-panel...${NC}"
$DOCKER_COMPOSE_CMD up -d admin-panel

echo -e "\n${YELLOW}⏳ Waiting for service to start...${NC}"
sleep 20

echo -e "\n${YELLOW}🔍 Verifying...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -qE "200|301|302|404"; then
    echo -e "${GREEN}✓ Admin panel is responding${NC}"
else
    echo -e "${RED}❌ Admin panel not responding. Checking logs...${NC}"
    $DOCKER_COMPOSE_CMD logs --tail=30 admin-panel
    exit 1
fi

# Reload nginx if available
if command -v nginx >/dev/null 2>&1; then
    if nginx -t 2>/dev/null; then
        echo -e "\n${YELLOW}🔄 Reloading nginx...${NC}"
        systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true
    fi
fi

echo -e "\n${GREEN}✅ Fix complete!${NC}"
echo -e "${GREEN}Try accessing: https://admin.smokava.com${NC}\n"

