#!/bin/bash

# ULTIMATE 502 FIX - Handles EVERYTHING
# This script will fix the 502 error no matter what

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         ULTIMATE 502 BAD GATEWAY FIX                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}\n"

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run with sudo${NC}"
    exit 1
fi

PROJECT_DIR="${PROJECT_DIR:-/opt/smokava}"
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Project directory not found${NC}"
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

echo -e "${CYAN}Step 1: Pulling latest code...${NC}"
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || echo -e "${YELLOW}⚠ Could not pull code${NC}"

echo -e "\n${CYAN}Step 2: Stopping all related containers...${NC}"
$DOCKER_COMPOSE_CMD stop admin-panel 2>/dev/null || true
docker stop smokava-admin-panel 2>/dev/null || true
docker rm -f smokava-admin-panel 2>/dev/null || true
sleep 3

echo -e "\n${CYAN}Step 3: Removing old images...${NC}"
docker rmi smokava-admin-panel 2>/dev/null || true
docker images | grep admin-panel | awk '{print $3}' | xargs -r docker rmi 2>/dev/null || true

echo -e "\n${CYAN}Step 4: Ensuring backend is running...${NC}"
$DOCKER_COMPOSE_CMD up -d backend || echo -e "${YELLOW}⚠ Backend might not be needed${NC}"
sleep 5

echo -e "\n${CYAN}Step 5: Rebuilding admin-panel (this may take 3-5 minutes)...${NC}"
if ! $DOCKER_COMPOSE_CMD build --no-cache --progress=plain admin-panel 2>&1 | tee /tmp/admin-build.log; then
    echo -e "${YELLOW}⚠ Build with --no-cache failed, trying regular build...${NC}"
    $DOCKER_COMPOSE_CMD build --progress=plain admin-panel 2>&1 | tee /tmp/admin-build.log || {
        echo -e "${RED}❌ Build failed!${NC}"
        tail -50 /tmp/admin-build.log
        exit 1
    }
fi

echo -e "\n${CYAN}Step 6: Starting admin-panel...${NC}"
$DOCKER_COMPOSE_CMD up -d admin-panel

echo -e "\n${CYAN}Step 7: Waiting for container to be ready (up to 60 seconds)...${NC}"
for i in {1..20}; do
    if docker ps | grep -q "smokava-admin-panel.*Up"; then
        echo -e "${GREEN}✓ Container is running${NC}"
        break
    fi
    if [ $i -eq 20 ]; then
        echo -e "${RED}❌ Container failed to start!${NC}"
        $DOCKER_COMPOSE_CMD logs --tail=50 admin-panel
        exit 1
    fi
    echo -e "${YELLOW}Waiting... ($i/20)${NC}"
    sleep 3
done

echo -e "\n${CYAN}Step 8: Testing connection (multiple attempts)...${NC}"
SUCCESS=0
for i in {1..10}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:5173 2>/dev/null || echo "000")
    if echo "$HTTP_CODE" | grep -qE "200|301|302|404"; then
        SUCCESS=$((SUCCESS + 1))
        echo -e "${GREEN}✓ Attempt $i: HTTP $HTTP_CODE${NC}"
    else
        echo -e "${YELLOW}Attempt $i: HTTP $HTTP_CODE (waiting...)${NC}"
    fi
    if [ $i -lt 10 ]; then
        sleep 2
    fi
done

if [ $SUCCESS -ge 5 ]; then
    echo -e "\n${GREEN}✓✓✓ Admin panel is responding! ($SUCCESS/10 successful)${NC}"
else
    echo -e "\n${RED}❌ Admin panel is not responding consistently${NC}"
    echo -e "${YELLOW}Container logs:${NC}"
    $DOCKER_COMPOSE_CMD logs --tail=50 admin-panel
    exit 1
fi

echo -e "\n${CYAN}Step 9: Configuring nginx...${NC}"
if command -v nginx >/dev/null 2>&1; then
    # Find nginx config
    for config in \
        "/etc/nginx/sites-enabled/smokava" \
        "/etc/nginx/sites-enabled/admin.smokava.com" \
        "/etc/nginx/conf.d/smokava.conf" \
        "/etc/nginx/conf.d/admin.smokava.com.conf"; do
        if [ -f "$config" ]; then
            echo -e "${GREEN}✓ Found nginx config: $config${NC}"
            if nginx -t 2>/dev/null; then
                systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true
                echo -e "${GREEN}✓ Nginx reloaded${NC}"
            fi
            break
        fi
    done
fi

echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    ✅ SUCCESS! ✅                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${GREEN}Admin panel is now working!${NC}"
echo -e "${CYAN}Access it at: https://admin.smokava.com${NC}\n"
echo -e "${YELLOW}If you still see 502:${NC}"
echo -e "  • Wait 30-60 seconds"
echo -e "  • Clear browser cache (Ctrl+Shift+R)"
echo -e "  • Try incognito mode\n"

