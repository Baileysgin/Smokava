#!/bin/bash

# Fix 502 Bad Gateway - Admin Panel Deployment Script
# This script fixes the 502 error by ensuring all services are running correctly

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Fix 502 Bad Gateway - Admin Panel    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root or with sudo${NC}"
    exit 1
fi

# Get project directory
PROJECT_DIR="${PROJECT_DIR:-/opt/smokava}"
if [ ! -d "$PROJECT_DIR" ]; then
    # Try current directory
    if [ -f "docker-compose.yml" ]; then
        PROJECT_DIR="$(pwd)"
    else
        echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
        echo -e "${YELLOW}Please set PROJECT_DIR environment variable or run from project root${NC}"
        exit 1
    fi
fi

cd "$PROJECT_DIR" || exit 1
echo -e "${GREEN}✓ Working directory: $PROJECT_DIR${NC}\n"

# Determine docker compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}❌ Neither 'docker compose' nor 'docker-compose' found!${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking current container status...${NC}"
$DOCKER_COMPOSE_CMD ps

echo -e "\n${YELLOW}Step 2: Stopping admin-panel container...${NC}"
$DOCKER_COMPOSE_CMD stop admin-panel 2>/dev/null || true
docker rm -f smokava-admin-panel 2>/dev/null || true

echo -e "\n${YELLOW}Step 3: Rebuilding admin-panel container...${NC}"
$DOCKER_COMPOSE_CMD build --no-cache admin-panel || {
    echo -e "${YELLOW}⚠ Build failed, trying without --no-cache...${NC}"
    $DOCKER_COMPOSE_CMD build admin-panel
}

echo -e "\n${YELLOW}Step 4: Starting admin-panel container...${NC}"
$DOCKER_COMPOSE_CMD up -d admin-panel

echo -e "\n${YELLOW}Step 5: Waiting for container to be ready...${NC}"
sleep 15

echo -e "\n${YELLOW}Step 6: Checking container status...${NC}"
if $DOCKER_COMPOSE_CMD ps | grep -q "smokava-admin-panel.*Up"; then
    echo -e "${GREEN}✓ Admin panel container is running${NC}"
else
    echo -e "${RED}❌ Admin panel container is not running!${NC}"
    echo -e "${YELLOW}Checking logs...${NC}"
    $DOCKER_COMPOSE_CMD logs --tail=50 admin-panel
    exit 1
fi

echo -e "\n${YELLOW}Step 7: Testing localhost:5173...${NC}"
for i in {1..5}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -qE "200|301|302|404"; then
        echo -e "${GREEN}✓ Admin panel is responding on localhost:5173${NC}"
        break
    else
        if [ $i -eq 5 ]; then
            echo -e "${RED}❌ Admin panel is NOT responding on localhost:5173${NC}"
            echo -e "${YELLOW}Container logs:${NC}"
            $DOCKER_COMPOSE_CMD logs --tail=30 admin-panel
            exit 1
        fi
        echo -e "${YELLOW}Waiting... (attempt $i/5)${NC}"
        sleep 5
    fi
done

echo -e "\n${YELLOW}Step 8: Checking nginx configuration...${NC}"
if command -v nginx >/dev/null 2>&1; then
    # Check if nginx config exists
    NGINX_CONFIG_FOUND=false

    # Check common locations
    for config_file in \
        "/etc/nginx/sites-enabled/smokava" \
        "/etc/nginx/sites-enabled/admin.smokava.com" \
        "/etc/nginx/conf.d/smokava.conf" \
        "/etc/nginx/conf.d/admin.smokava.com.conf"; do
        if [ -f "$config_file" ]; then
            NGINX_CONFIG_FOUND=true
            echo -e "${GREEN}✓ Found nginx config: $config_file${NC}"

            # Check if it has correct proxy_pass
            if grep -q "proxy_pass.*5173" "$config_file"; then
                echo -e "${GREEN}✓ Nginx config has correct proxy_pass to port 5173${NC}"
            else
                echo -e "${YELLOW}⚠ Nginx config might not have correct proxy_pass${NC}"
            fi
            break
        fi
    done

    if [ "$NGINX_CONFIG_FOUND" = false ]; then
        echo -e "${YELLOW}⚠ Nginx config not found in common locations${NC}"
        echo -e "${YELLOW}You may need to configure nginx manually${NC}"
    else
        # Test nginx config
        if nginx -t 2>/dev/null; then
            echo -e "${GREEN}✓ Nginx configuration is valid${NC}"

            # Reload nginx
            echo -e "${YELLOW}Reloading nginx...${NC}"
            if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
                echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
            else
                echo -e "${YELLOW}⚠ Could not reload nginx (might need manual reload)${NC}"
            fi
        else
            echo -e "${RED}❌ Nginx configuration has errors!${NC}"
            nginx -t
        fi
    fi
else
    echo -e "${YELLOW}⚠ Nginx not found - skipping nginx checks${NC}"
fi

echo -e "\n${YELLOW}Step 9: Final health check...${NC}"
sleep 3

# Final verification
CONTAINER_STATUS=$($DOCKER_COMPOSE_CMD ps smokava-admin-panel 2>/dev/null | tail -n 1 | awk '{print $7}' || echo "Unknown")
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "000")

echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}           Deployment Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "Container Status: ${CONTAINER_STATUS}"
echo -e "HTTP Status (localhost:5173): ${HTTP_STATUS}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

if [ "$CONTAINER_STATUS" = "Up" ] && echo "$HTTP_STATUS" | grep -qE "200|301|302|404"; then
    echo -e "${GREEN}✅ SUCCESS! Admin panel should be working now.${NC}\n"
    echo -e "${GREEN}Try accessing: https://admin.smokava.com${NC}\n"

    echo -e "${YELLOW}If you still see 502 errors:${NC}"
    echo -e "  1. Wait 30 seconds for nginx to fully reload"
    echo -e "  2. Clear your browser cache"
    echo -e "  3. Check nginx logs: tail -f /var/log/nginx/error.log"
    echo -e "  4. Check container logs: $DOCKER_COMPOSE_CMD logs -f admin-panel"
else
    echo -e "${RED}❌ Something is still not working.${NC}\n"
    echo -e "${YELLOW}Debugging information:${NC}"
    echo -e "Container logs:"
    $DOCKER_COMPOSE_CMD logs --tail=20 admin-panel
    echo -e "\nContainer status:"
    $DOCKER_COMPOSE_CMD ps admin-panel
    exit 1
fi
