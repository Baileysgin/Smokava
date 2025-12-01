#!/bin/bash

# Complete 502 Bad Gateway Fix with Full Testing
# This script fixes the issue and verifies it works

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Complete 502 Bad Gateway Fix & Verification     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run with sudo${NC}"
    exit 1
fi

# Get project directory
PROJECT_DIR="${PROJECT_DIR:-/opt/smokava}"
if [ ! -d "$PROJECT_DIR" ]; then
    if [ -f "docker-compose.yml" ]; then
        PROJECT_DIR="$(pwd)"
    else
        echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
        exit 1
    fi
fi

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

# Function to test connection
test_connection() {
    local url=$1
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null || echo "000")
        if echo "$HTTP_CODE" | grep -qE "200|301|302|404"; then
            return 0
        fi
        if [ $attempt -lt $max_attempts ]; then
            sleep 2
        fi
        attempt=$((attempt + 1))
    done
    return 1
}

# Step 1: Pull latest code
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1: Pulling latest code...${NC}"
if git pull origin main 2>/dev/null || git pull origin master 2>/dev/null; then
    echo -e "${GREEN}✓ Code updated${NC}"
else
    echo -e "${YELLOW}⚠ Could not pull code (continuing anyway)${NC}"
fi

# Step 2: Check current status
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2: Checking current status...${NC}"
$DOCKER_COMPOSE_CMD ps

# Step 3: Stop and clean up
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3: Stopping and cleaning up admin-panel...${NC}"
$DOCKER_COMPOSE_CMD stop admin-panel 2>/dev/null || true
docker rm -f smokava-admin-panel 2>/dev/null || true
sleep 2

# Step 4: Rebuild
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 4: Rebuilding admin-panel container...${NC}"
if $DOCKER_COMPOSE_CMD build --no-cache admin-panel 2>&1 | tee /tmp/admin-build.log; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${YELLOW}⚠ Build with --no-cache failed, trying without...${NC}"
    if $DOCKER_COMPOSE_CMD build admin-panel 2>&1 | tee /tmp/admin-build.log; then
        echo -e "${GREEN}✓ Build successful${NC}"
    else
        echo -e "${RED}❌ Build failed!${NC}"
        echo -e "${YELLOW}Build logs:${NC}"
        tail -20 /tmp/admin-build.log
        exit 1
    fi
fi

# Step 5: Start container
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 5: Starting admin-panel container...${NC}"
$DOCKER_COMPOSE_CMD up -d admin-panel

# Step 6: Wait and verify container
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 6: Waiting for container to start...${NC}"
sleep 5

CONTAINER_STATUS=$($DOCKER_COMPOSE_CMD ps smokava-admin-panel 2>/dev/null | tail -n 1 | awk '{print $7}' || echo "Unknown")
echo -e "Container status: ${CONTAINER_STATUS}"

if [ "$CONTAINER_STATUS" != "Up" ]; then
    echo -e "${RED}❌ Container is not running!${NC}"
    echo -e "${YELLOW}Container logs:${NC}"
    $DOCKER_COMPOSE_CMD logs --tail=50 admin-panel
    exit 1
fi

# Step 7: Test localhost:5173
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 7: Testing localhost:5173...${NC}"
sleep 10

if test_connection "http://localhost:5173"; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
    echo -e "${GREEN}✓ Admin panel is responding (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Admin panel is NOT responding on localhost:5173${NC}"
    echo -e "${YELLOW}Checking container logs...${NC}"
    $DOCKER_COMPOSE_CMD logs --tail=50 admin-panel
    echo -e "\n${YELLOW}Checking if port is in use...${NC}"
    netstat -tlnp 2>/dev/null | grep 5173 || ss -tlnp 2>/dev/null | grep 5173 || echo "Port check unavailable"
    exit 1
fi

# Step 8: Check nginx configuration
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 8: Checking nginx configuration...${NC}"

if command -v nginx >/dev/null 2>&1; then
    # Find nginx config
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
        
        # Check if it has correct proxy_pass
        if grep -q "proxy_pass.*5173" "$NGINX_CONFIG"; then
            echo -e "${GREEN}✓ Nginx config has correct proxy_pass to port 5173${NC}"
        else
            echo -e "${YELLOW}⚠ Nginx config might not have correct proxy_pass${NC}"
            echo -e "${YELLOW}Checking proxy_pass settings...${NC}"
            grep -n "proxy_pass" "$NGINX_CONFIG" || echo "No proxy_pass found"
        fi
        
        # Test nginx config
        if nginx -t 2>/dev/null; then
            echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
            
            # Reload nginx
            echo -e "${YELLOW}Reloading nginx...${NC}"
            if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
                echo -e "${GREEN}✓ Nginx reloaded${NC}"
            else
                echo -e "${YELLOW}⚠ Could not reload nginx (might need manual reload)${NC}"
            fi
        else
            echo -e "${RED}❌ Nginx configuration has errors!${NC}"
            nginx -t
        fi
    else
        echo -e "${YELLOW}⚠ Nginx config not found in common locations${NC}"
        echo -e "${YELLOW}You may need to configure nginx manually${NC}"
        echo -e "${YELLOW}Expected config should proxy to: http://localhost:5173${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Nginx not found - skipping nginx checks${NC}"
fi

# Step 9: Final verification
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 9: Final verification...${NC}"
sleep 5

# Test multiple times
SUCCESS_COUNT=0
TOTAL_TESTS=5

for i in $(seq 1 $TOTAL_TESTS); do
    if test_connection "http://localhost:5173"; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo -e "${GREEN}✓ Test $i/$TOTAL_TESTS passed${NC}"
    else
        echo -e "${RED}✗ Test $i/$TOTAL_TESTS failed${NC}"
    fi
    sleep 1
done

# Final summary
echo -e "\n${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Final Status Report                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"

CONTAINER_STATUS=$($DOCKER_COMPOSE_CMD ps smokava-admin-panel 2>/dev/null | tail -n 1 | awk '{print $7}' || echo "Unknown")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:5173 2>/dev/null || echo "000")

echo -e "Container Status: ${CONTAINER_STATUS}"
echo -e "HTTP Status Code: ${HTTP_CODE}"
echo -e "Connection Tests: ${SUCCESS_COUNT}/${TOTAL_TESTS} passed"

if [ "$CONTAINER_STATUS" = "Up" ] && [ "$SUCCESS_COUNT" -ge 3 ]; then
    echo -e "\n${GREEN}✅ SUCCESS! Admin panel is working correctly.${NC}\n"
    echo -e "${GREEN}The admin panel should now be accessible at:${NC}"
    echo -e "${CYAN}   https://admin.smokava.com${NC}\n"
    echo -e "${YELLOW}If you still see 502 errors:${NC}"
    echo -e "  1. Wait 30-60 seconds for DNS/nginx to propagate"
    echo -e "  2. Clear your browser cache (Ctrl+Shift+R)"
    echo -e "  3. Try in incognito/private mode"
    echo -e "  4. Check nginx logs: tail -f /var/log/nginx/error.log"
    exit 0
else
    echo -e "\n${RED}❌ ISSUES DETECTED${NC}\n"
    echo -e "${YELLOW}Debugging information:${NC}"
    echo -e "\n${YELLOW}Container logs (last 30 lines):${NC}"
    $DOCKER_COMPOSE_CMD logs --tail=30 admin-panel
    
    echo -e "\n${YELLOW}Container status:${NC}"
    $DOCKER_COMPOSE_CMD ps admin-panel
    
    echo -e "\n${YELLOW}Port check:${NC}"
    netstat -tlnp 2>/dev/null | grep 5173 || ss -tlnp 2>/dev/null | grep 5173 || echo "Port check unavailable"
    
    if command -v nginx >/dev/null 2>&1; then
        echo -e "\n${YELLOW}Nginx error log (last 10 lines):${NC}"
        tail -10 /var/log/nginx/error.log 2>/dev/null || echo "Nginx log unavailable"
    fi
    
    exit 1
fi

