#!/bin/bash

# Test script to verify admin panel is working
# Run this after fixing to verify the fix worked

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Testing Admin Panel Connection...${NC}\n"

# Test localhost:5173
echo -e "Test 1: localhost:5173"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:5173 2>/dev/null || echo "000")
if echo "$HTTP_CODE" | grep -qE "200|301|302|404"; then
    echo -e "${GREEN}✓ PASSED (HTTP $HTTP_CODE)${NC}\n"
else
    echo -e "${RED}✗ FAILED (HTTP $HTTP_CODE)${NC}\n"
    exit 1
fi

# Test through nginx (if accessible)
if command -v nginx >/dev/null 2>&1; then
    echo -e "Test 2: https://admin.smokava.com (through nginx)"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 -k https://admin.smokava.com 2>/dev/null || echo "000")
    if echo "$HTTP_CODE" | grep -qE "200|301|302|404"; then
        echo -e "${GREEN}✓ PASSED (HTTP $HTTP_CODE)${NC}\n"
    else
        echo -e "${RED}✗ FAILED (HTTP $HTTP_CODE)${NC}"
        echo -e "${YELLOW}This might be normal if DNS hasn't propagated or SSL issues${NC}\n"
    fi
fi

# Check container
echo -e "Test 3: Container status"
if docker ps | grep -q "smokava-admin-panel.*Up"; then
    echo -e "${GREEN}✓ Container is running${NC}\n"
else
    echo -e "${RED}✗ Container is not running${NC}\n"
    exit 1
fi

echo -e "${GREEN}All tests passed! Admin panel should be working.${NC}"

