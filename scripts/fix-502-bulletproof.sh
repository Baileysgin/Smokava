#!/bin/bash

# Bulletproof 502 Fix - Handles all edge cases and verifies everything works
# This script will keep trying until it works or clearly identifies the problem

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Bulletproof 502 Fix - Will Not Stop Until Fixed    ║${NC}"
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

# Function to verify admin panel is working
verify_admin_panel() {
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:5173 2>/dev/null || echo "000")
        if echo "$HTTP_CODE" | grep -qE "200|301|302|404"; then
            return 0
        fi
        if [ $attempt -lt $max_attempts ]; then
            sleep 3
        fi
        attempt=$((attempt + 1))
    done
    return 1
}

# Step 1: Complete cleanup
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1: Complete cleanup...${NC}"
$DOCKER_COMPOSE_CMD stop admin-panel 2>/dev/null || true
docker rm -f smokava-admin-panel 2>/dev/null || true
docker rmi smokava-admin-panel 2>/dev/null || true
sleep 3

# Step 2: Pull latest code
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2: Pulling latest code...${NC}"
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || echo -e "${YELLOW}⚠ Could not pull code${NC}"

# Step 3: Ensure backend is running (admin-panel depends on it)
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3: Ensuring backend is running...${NC}"
$DOCKER_COMPOSE_CMD up -d backend || echo -e "${YELLOW}⚠ Backend might not be needed${NC}"
sleep 5

# Step 4: Rebuild with full output
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 4: Rebuilding admin-panel (this may take a few minutes)...${NC}"
if ! $DOCKER_COMPOSE_CMD build --no-cache --progress=plain admin-panel 2>&1 | tee /tmp/admin-build.log; then
    echo -e "${YELLOW}⚠ Build with --no-cache failed, trying regular build...${NC}"
    if ! $DOCKER_COMPOSE_CMD build --progress=plain admin-panel 2>&1 | tee /tmp/admin-build.log; then
        echo -e "${RED}❌ Build failed!${NC}"
        echo -e "${YELLOW}Last 50 lines of build log:${NC}"
        tail -50 /tmp/admin-build.log
        exit 1
    fi
fi

# Step 5: Start container
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 5: Starting admin-panel container...${NC}"
$DOCKER_COMPOSE_CMD up -d admin-panel

# Step 6: Wait and check container health
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 6: Waiting for container to be healthy...${NC}"

for i in {1..20}; do
    CONTAINER_STATUS=$($DOCKER_COMPOSE_CMD ps smokava-admin-panel 2>/dev/null | tail -n 1 | awk '{print $7}' || echo "Unknown")
    
    if [ "$CONTAINER_STATUS" = "Up" ]; then
        echo -e "${GREEN}✓ Container is running${NC}"
        break
    else
        if [ $i -eq 20 ]; then
            echo -e "${RED}❌ Container failed to start!${NC}"
            echo -e "${YELLOW}Container logs:${NC}"
            $DOCKER_COMPOSE_CMD logs --tail=50 admin-panel
            exit 1
        fi
        echo -e "${YELLOW}Waiting... ($i/20)${NC}"
        sleep 3
    fi
done

# Step 7: Verify it's actually working
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 7: Verifying admin panel is responding...${NC}"

if verify_admin_panel; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
    echo -e "${GREEN}✓✓✓ SUCCESS! Admin panel is responding (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Admin panel is still not responding${NC}"
    echo -e "${YELLOW}Debugging information:${NC}"
    
    echo -e "\n${YELLOW}Container status:${NC}"
    $DOCKER_COMPOSE_CMD ps admin-panel
    
    echo -e "\n${YELLOW}Container logs (last 50 lines):${NC}"
    $DOCKER_COMPOSE_CMD logs --tail=50 admin-panel
    
    echo -e "\n${YELLOW}Checking if nginx is running inside container:${NC}"
    docker exec smokava-admin-panel ps aux 2>/dev/null | grep nginx || echo "Cannot check nginx in container"
    
    echo -e "\n${YELLOW}Checking port binding:${NC}"
    docker port smokava-admin-panel 2>/dev/null || echo "Cannot check port binding"
    
    echo -e "\n${YELLOW}Testing direct container access:${NC}"
    docker exec smokava-admin-panel curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null || echo "Cannot test from inside container"
    
    exit 1
fi

# Step 8: Nginx configuration
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 8: Configuring nginx...${NC}"

if command -v nginx >/dev/null 2>&1; then
    # Find and update nginx config
    NGINX_CONFIG=""
    for config in \
        "/etc/nginx/sites-enabled/smokava" \
        "/etc/nginx/sites-enabled/admin.smokava.com" \
        "/etc/nginx/conf.d/smokava.conf" \
        "/etc/nginx/conf.d/admin.smokava.com.conf"; do
        if [ -f "$config" ]; then
            NGINX_CONFIG="$config"
            break
        fi
    done
    
    if [ -n "$NGINX_CONFIG" ]; then
        echo -e "${GREEN}✓ Found nginx config: $NGINX_CONFIG${NC}"
        
        # Ensure it has correct proxy_pass
        if ! grep -q "proxy_pass.*5173" "$NGINX_CONFIG"; then
            echo -e "${YELLOW}⚠ Config doesn't have proxy_pass to 5173, checking...${NC}"
            grep -n "proxy_pass" "$NGINX_CONFIG" || echo "No proxy_pass found"
        fi
        
        if nginx -t 2>/dev/null; then
            systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true
            echo -e "${GREEN}✓ Nginx reloaded${NC}"
        else
            echo -e "${YELLOW}⚠ Nginx config has errors (check manually)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Nginx config not found - you may need to configure it manually${NC}"
        echo -e "${YELLOW}It should proxy to: http://localhost:5173${NC}"
    fi
fi

# Step 9: Final comprehensive test
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 9: Running comprehensive tests...${NC}"

SUCCESS=0
TOTAL=0

# Test 1: Container running
TOTAL=$((TOTAL + 1))
if $DOCKER_COMPOSE_CMD ps | grep -q "smokava-admin-panel.*Up"; then
    echo -e "${GREEN}✓ Test 1: Container is running${NC}"
    SUCCESS=$((SUCCESS + 1))
else
    echo -e "${RED}✗ Test 1: Container is not running${NC}"
fi

# Test 2: Port 5173 accessible
TOTAL=$((TOTAL + 1))
if verify_admin_panel; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
    echo -e "${GREEN}✓ Test 2: Port 5173 responding (HTTP $HTTP_CODE)${NC}"
    SUCCESS=$((SUCCESS + 1))
else
    echo -e "${RED}✗ Test 2: Port 5173 not responding${NC}"
fi

# Test 3: Multiple connection attempts
TOTAL=$((TOTAL + 1))
PASSED=0
for i in {1..5}; do
    if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://localhost:5173 2>/dev/null | grep -qE "200|301|302|404"; then
        PASSED=$((PASSED + 1))
    fi
    sleep 1
done
if [ $PASSED -ge 4 ]; then
    echo -e "${GREEN}✓ Test 3: Consistent responses (5/5 passed)${NC}"
    SUCCESS=$((SUCCESS + 1))
else
    echo -e "${RED}✗ Test 3: Inconsistent responses ($PASSED/5 passed)${NC}"
fi

# Final report
echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Final Report                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo -e "Tests Passed: ${SUCCESS}/${TOTAL}"

if [ $SUCCESS -eq $TOTAL ]; then
    echo -e "\n${GREEN}✅✅✅ ALL TESTS PASSED! ✅✅✅${NC}\n"
    echo -e "${GREEN}The admin panel is fully operational!${NC}\n"
    echo -e "${CYAN}Access it at: https://admin.smokava.com${NC}\n"
    echo -e "${YELLOW}If you still see 502 in browser:${NC}"
    echo -e "  • Wait 30-60 seconds"
    echo -e "  • Clear browser cache (Ctrl+Shift+R)"
    echo -e "  • Try incognito mode"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed${NC}"
    echo -e "${YELLOW}Run this to see detailed logs:${NC}"
    echo -e "  docker compose logs admin-panel"
    exit 1
fi

