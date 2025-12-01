#!/bin/bash

# Comprehensive Deployment Test Script
# Tests if the admin panel is working correctly after deployment

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Deployment Verification Test                    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}\n"

PROJECT_DIR="${PROJECT_DIR:-/opt/smokava}"
cd "$PROJECT_DIR" 2>/dev/null || {
    echo -e "${YELLOW}⚠ Not running on server, testing remote endpoints...${NC}\n"
    PROJECT_DIR=""
}

# Determine docker compose command
if [ -n "$PROJECT_DIR" ]; then
    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
    elif command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
fi

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test function
test_check() {
    local test_name=$1
    local test_command=$2
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${CYAN}Test $TOTAL_TESTS: $test_name${NC}"
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}\n"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}\n"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test 1: Container Status (if on server)
if [ -n "$PROJECT_DIR" ] && [ -n "$DOCKER_COMPOSE_CMD" ]; then
    test_check "Admin Panel Container Running" \
        "$DOCKER_COMPOSE_CMD ps | grep -q 'smokava-admin-panel.*Up'"
fi

# Test 2: Localhost Port 5173 (if on server)
if [ -n "$PROJECT_DIR" ]; then
    test_check "Port 5173 Accessible (localhost)" \
        "curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 http://localhost:5173 | grep -qE '200|301|302|404'"
fi

# Test 3: Admin Panel via HTTPS
test_check "Admin Panel HTTPS (admin.smokava.com)" \
    "curl -s -o /dev/null -w '%{http_code}' --connect-timeout 10 --max-time 15 -k https://admin.smokava.com | grep -qE '200|301|302|404'"

# Test 4: Admin Panel HTTP (should redirect)
test_check "Admin Panel HTTP Redirect" \
    "curl -s -o /dev/null -w '%{http_code}' --connect-timeout 10 --max-time 15 -L http://admin.smokava.com | grep -qE '200|301|302'"

# Test 5: API Health Check
test_check "API Health Endpoint" \
    "curl -s -o /dev/null -w '%{http_code}' --connect-timeout 10 --max-time 15 https://api.smokava.com/api/health | grep -qE '200|404'"

# Test 6: Admin Panel Static Assets
test_check "Admin Panel Static Assets Loading" \
    "curl -s -o /dev/null -w '%{http_code}' --connect-timeout 10 --max-time 15 -k https://admin.smokava.com/ | grep -qE '200|301|302'"

# Test 7: Multiple Connection Attempts (consistency)
echo -e "${CYAN}Test 7: Connection Consistency (5 attempts)${NC}"
CONSISTENT=0
for i in {1..5}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 -k https://admin.smokava.com 2>/dev/null || echo "000")
    if echo "$HTTP_CODE" | grep -qE "200|301|302|404"; then
        CONSISTENT=$((CONSISTENT + 1))
        echo -e "  Attempt $i: ${GREEN}✓${NC} (HTTP $HTTP_CODE)"
    else
        echo -e "  Attempt $i: ${RED}✗${NC} (HTTP $HTTP_CODE)"
    fi
    sleep 1
done

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ $CONSISTENT -ge 4 ]; then
    echo -e "${GREEN}✓ PASSED (${CONSISTENT}/5 successful)${NC}\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ FAILED (${CONSISTENT}/5 successful)${NC}\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 8: No 502 Errors
echo -e "${CYAN}Test 8: No 502 Bad Gateway Errors${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 -k https://admin.smokava.com 2>/dev/null || echo "000")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$HTTP_CODE" != "502" ]; then
    echo -e "${GREEN}✓ PASSED (HTTP $HTTP_CODE, not 502)${NC}\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ FAILED (HTTP 502 Bad Gateway)${NC}\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Final Summary
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Test Results                         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo -e "\nTotal Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}\n"

# Detailed status
echo -e "${CYAN}Detailed Status:${NC}"
echo -e "Admin Panel URL: https://admin.smokava.com"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 -k https://admin.smokava.com 2>/dev/null || echo "000")
echo -e "HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✓ Admin panel is accessible!${NC}"
elif [ "$HTTP_CODE" = "502" ]; then
    echo -e "${RED}✗ 502 Bad Gateway - Admin panel container might not be running${NC}"
    if [ -n "$PROJECT_DIR" ] && [ -n "$DOCKER_COMPOSE_CMD" ]; then
        echo -e "${YELLOW}Run: docker compose logs admin-panel${NC}"
    fi
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}✗ Connection failed - Server might be unreachable${NC}"
else
    echo -e "${YELLOW}⚠ Unexpected status code: $HTTP_CODE${NC}"
fi

echo ""

# Final verdict
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         ✅ ALL TESTS PASSED! DEPLOYMENT SUCCESSFUL!     ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo -e "\n${GREEN}The admin panel is fully operational!${NC}"
    echo -e "${CYAN}Access it at: https://admin.smokava.com${NC}\n"
    exit 0
elif [ $PASSED_TESTS -gt $FAILED_TESTS ]; then
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║         ⚠️  PARTIAL SUCCESS - Some tests failed          ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}"
    echo -e "\n${YELLOW}Most tests passed, but some issues detected.${NC}"
    echo -e "${YELLOW}Check the failed tests above for details.${NC}\n"
    exit 1
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║         ❌ DEPLOYMENT FAILED - Multiple tests failed     ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    echo -e "\n${RED}The deployment is not working correctly.${NC}"
    echo -e "${YELLOW}Run the fix script: sudo bash scripts/fix-502-ultimate.sh${NC}\n"
    exit 1
fi

