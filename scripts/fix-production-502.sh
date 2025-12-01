#!/bin/bash

# Production 502 Fix Script
# Fixes port mismatch between Docker and Nginx

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Production 502 Fix - Port Mismatch Fix         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}\n"

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

echo -e "${YELLOW}📋 Step 1: Checking current configuration...${NC}"

# Check current port mapping
CURRENT_PORT=$(grep -A 1 "backend:" docker-compose.yml | grep "5001:5000" || echo "")
if [ -n "$CURRENT_PORT" ]; then
    echo -e "${YELLOW}⚠️  Found port mismatch: backend is on 5001:5000${NC}"
    echo -e "${YELLOW}   Nginx expects 5000, fixing...${NC}"
else
    echo -e "${GREEN}✅ Port configuration looks correct${NC}"
fi

echo -e "\n${YELLOW}📋 Step 2: Pulling latest code...${NC}"
git pull || echo -e "${YELLOW}⚠️  Git pull failed, continuing...${NC}"

echo -e "\n${YELLOW}📋 Step 3: Fixing docker-compose.yml port mapping...${NC}"
if grep -q '"5001:5000"' docker-compose.yml; then
    sed -i.bak 's/"5001:5000"/"5000:5000"/g' docker-compose.yml
    echo -e "${GREEN}✅ Updated backend port from 5001:5000 to 5000:5000${NC}"
else
    echo -e "${GREEN}✅ Port mapping already correct${NC}"
fi

echo -e "\n${YELLOW}📋 Step 4: Stopping backend container...${NC}"
$DOCKER_COMPOSE_CMD stop backend || echo -e "${YELLOW}⚠️  Backend not running${NC}"

echo -e "\n${YELLOW}📋 Step 5: Starting backend with new port mapping...${NC}"
$DOCKER_COMPOSE_CMD up -d backend

echo -e "\n${YELLOW}📋 Step 6: Waiting for backend to be ready...${NC}"
sleep 15

echo -e "\n${YELLOW}📋 Step 7: Testing backend on localhost:5000...${NC}"
MAX_ATTEMPTS=10
ATTEMPT=1
while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is responding on port 5000!${NC}"
        break
    fi
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Backend not responding after $MAX_ATTEMPTS attempts${NC}"
        echo -e "${YELLOW}   Checking logs...${NC}"
        $DOCKER_COMPOSE_CMD logs --tail=20 backend
        exit 1
    fi
    echo -e "${YELLOW}   Attempt $ATTEMPT/$MAX_ATTEMPTS... waiting...${NC}"
    sleep 3
    ATTEMPT=$((ATTEMPT + 1))
done

echo -e "\n${YELLOW}📋 Step 8: Testing all services...${NC}"

# Test backend
if curl -s -f http://localhost:5000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend (localhost:5000) - OK${NC}"
else
    echo -e "${RED}❌ Backend (localhost:5000) - FAILED${NC}"
fi

# Test frontend
if curl -s -f http://localhost:3000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend (localhost:3000) - OK${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend (localhost:3000) - Not responding${NC}"
fi

# Test admin panel
if curl -s -f http://localhost:5173/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Admin Panel (localhost:5173) - OK${NC}"
else
    echo -e "${YELLOW}⚠️  Admin Panel (localhost:5173) - Not responding${NC}"
fi

echo -e "\n${YELLOW}📋 Step 9: Testing nginx configuration...${NC}"
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors:${NC}"
    sudo nginx -t
    exit 1
fi

echo -e "\n${YELLOW}📋 Step 10: Reloading nginx...${NC}"
sudo systemctl reload nginx
echo -e "${GREEN}✅ Nginx reloaded${NC}"

echo -e "\n${YELLOW}📋 Step 11: Testing production URLs...${NC}"
sleep 5

# Test API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 https://api.smokava.com/api/health 2>/dev/null || echo "000")
if [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ https://api.smokava.com - OK (Status: $API_STATUS)${NC}"
else
    echo -e "${RED}❌ https://api.smokava.com - FAILED (Status: $API_STATUS)${NC}"
fi

# Test Frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 https://smokava.com 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ] || [ "$FRONTEND_STATUS" = "301" ] || [ "$FRONTEND_STATUS" = "302" ]; then
    echo -e "${GREEN}✅ https://smokava.com - OK (Status: $FRONTEND_STATUS)${NC}"
else
    echo -e "${RED}❌ https://smokava.com - FAILED (Status: $FRONTEND_STATUS)${NC}"
fi

# Test Admin Panel
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 https://admin.smokava.com 2>/dev/null || echo "000")
if [ "$ADMIN_STATUS" = "200" ] || [ "$ADMIN_STATUS" = "301" ] || [ "$ADMIN_STATUS" = "302" ]; then
    echo -e "${GREEN}✅ https://admin.smokava.com - OK (Status: $ADMIN_STATUS)${NC}"
else
    echo -e "${RED}❌ https://admin.smokava.com - FAILED (Status: $ADMIN_STATUS)${NC}"
fi

echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Fix Complete!                         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}✅ Port mismatch has been fixed${NC}"
echo -e "${YELLOW}📝 If you still see 502 errors:${NC}"
echo -e "   1. Wait 30-60 seconds for DNS/CDN to update"
echo -e "   2. Clear your browser cache (Ctrl+Shift+R)"
echo -e "   3. Try in incognito/private mode"
echo -e "   4. Check: docker compose ps"
echo -e "   5. Check: docker compose logs backend"

