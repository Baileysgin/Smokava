#!/bin/bash

# ===========================================
# NGINX UPSTREAM TEST SCRIPT
# ===========================================
# Tests all Nginx upstreams internally

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  NGINX UPSTREAM TEST${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test backend upstream
echo -n "Testing backend upstream (localhost:5000): "
if curl -f -s --max-time 5 "http://localhost:5000/api/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is reachable${NC}"
    curl -s "http://localhost:5000/api/health" | head -c 100
    echo ""
else
    echo -e "${RED}❌ Backend is NOT reachable${NC}"
    echo -e "${YELLOW}   This will cause 502 errors for api.smokava.com${NC}"
fi

# Test frontend upstream
echo -n "Testing frontend upstream (localhost:3000): "
if curl -f -s --max-time 5 "http://localhost:3000" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is reachable${NC}"
else
    echo -e "${RED}❌ Frontend is NOT reachable${NC}"
    echo -e "${YELLOW}   This will cause 502 errors for smokava.com${NC}"
fi

# Test admin panel upstream
echo -n "Testing admin panel upstream (localhost:5173): "
if curl -f -s --max-time 5 "http://localhost:5173" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Admin panel is reachable${NC}"
else
    echo -e "${RED}❌ Admin panel is NOT reachable${NC}"
    echo -e "${YELLOW}   This will cause 502 errors for admin.smokava.com${NC}"
fi

echo ""
echo -e "${BLUE}Testing Nginx configuration...${NC}"
if nginx -t 2>&1; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Checking Nginx status...${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx is NOT running${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Testing external endpoints (if DNS is configured)...${NC}"

# Test external endpoints
ENDPOINTS=(
    "https://api.smokava.com/api/health"
    "https://smokava.com"
    "https://admin.smokava.com"
)

for ENDPOINT in "${ENDPOINTS[@]}"; do
    echo -n "Testing $ENDPOINT: "
    if curl -f -s --max-time 10 "$ENDPOINT" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Not accessible (may be DNS or SSL issue)${NC}"
    fi
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Nginx upstream test complete${NC}"
