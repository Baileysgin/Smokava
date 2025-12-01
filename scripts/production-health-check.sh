#!/bin/bash

# ===========================================
# PRODUCTION HEALTH CHECK SCRIPT
# ===========================================
# Comprehensive health check for production environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="${PROJECT_DIR:-/opt/smokava}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PRODUCTION HEALTH CHECK${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd "$PROJECT_DIR" || exit 1

# Determine docker compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}❌ Docker Compose not found!${NC}"
    exit 1
fi

ERRORS=0

# 1. Check Docker services
echo -e "${BLUE}[1/6] Checking Docker services...${NC}"
if $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker services are running${NC}"
    $DOCKER_COMPOSE_CMD ps
else
    echo -e "${RED}❌ Docker services are NOT running${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 2. Check MongoDB
echo -e "${BLUE}[2/6] Checking MongoDB...${NC}"
if docker exec smokava-mongodb mongosh --quiet --eval "db.runCommand('ping').ok" smokava 2>/dev/null | grep -q "1"; then
    echo -e "${GREEN}✅ MongoDB is healthy${NC}"

    # Check database content
    USER_COUNT=$(docker exec smokava-mongodb mongosh --quiet --eval "db.users.countDocuments()" smokava 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")
    if [ "$USER_COUNT" != "0" ] && [ -n "$USER_COUNT" ]; then
        echo -e "${GREEN}   Database contains $USER_COUNT users${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Database appears empty${NC}"
    fi
else
    echo -e "${RED}❌ MongoDB is NOT healthy${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 3. Check Backend API
echo -e "${BLUE}[3/6] Checking Backend API...${NC}"
if curl -f -s --max-time 5 "http://localhost:5000/api/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
    HEALTH_RESPONSE=$(curl -s "http://localhost:5000/api/health" 2>/dev/null || echo "")
    if [ -n "$HEALTH_RESPONSE" ]; then
        echo "   Response: $HEALTH_RESPONSE"
    fi
else
    echo -e "${RED}❌ Backend API is NOT healthy${NC}"
    echo -e "${YELLOW}   Checking logs...${NC}"
    docker logs --tail 10 smokava-backend 2>&1 | tail -5
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 4. Check Frontend
echo -e "${BLUE}[4/6] Checking Frontend...${NC}"
if curl -f -s --max-time 5 "http://localhost:3000" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend is NOT accessible${NC}"
    echo -e "${YELLOW}   Checking logs...${NC}"
    docker logs --tail 10 smokava-frontend 2>&1 | tail -5
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 5. Check Admin Panel
echo -e "${BLUE}[5/6] Checking Admin Panel...${NC}"
if curl -f -s --max-time 5 "http://localhost:5173" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Admin Panel is accessible${NC}"
else
    echo -e "${RED}❌ Admin Panel is NOT accessible${NC}"
    echo -e "${YELLOW}   Checking logs...${NC}"
    docker logs --tail 10 smokava-admin-panel 2>&1 | tail -5
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 6. Check Nginx
echo -e "${BLUE}[6/6] Checking Nginx...${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"

    if nginx -t 2>&1 | grep -q "successful"; then
        echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
    else
        echo -e "${RED}❌ Nginx configuration has errors${NC}"
        nginx -t
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ Nginx is NOT running${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED - Production is healthy!${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS CHECK(S) FAILED - Production has issues${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Check service logs: $DOCKER_COMPOSE_CMD logs -f [service-name]"
    echo "  2. Restart services: $DOCKER_COMPOSE_CMD restart [service-name]"
    echo "  3. Check Nginx logs: tail -f /var/log/nginx/error.log"
    exit 1
fi
