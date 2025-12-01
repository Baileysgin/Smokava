#!/bin/bash

# Fix 502 Bad Gateway for Admin Panel
# This script checks and fixes the admin panel service

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Admin Panel 502 Bad Gateway Fix ===${NC}\n"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Determine docker compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}Neither 'docker compose' nor 'docker-compose' found!${NC}"
    exit 1
fi

# Get project directory (default to /opt/smokava or current directory)
PROJECT_DIR="${PROJECT_DIR:-/opt/smokava}"
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="$(pwd)"
fi

cd "$PROJECT_DIR" || exit 1

echo -e "${YELLOW}Step 1: Checking Docker containers status...${NC}"
$DOCKER_COMPOSE_CMD ps

echo -e "\n${YELLOW}Step 2: Checking admin-panel container specifically...${NC}"
if $DOCKER_COMPOSE_CMD ps | grep -q "smokava-admin-panel"; then
    ADMIN_STATUS=$($DOCKER_COMPOSE_CMD ps smokava-admin-panel | tail -n 1 | awk '{print $7}')
    echo "Admin panel status: $ADMIN_STATUS"

    if [ "$ADMIN_STATUS" != "Up" ]; then
        echo -e "${YELLOW}Admin panel container is not running. Starting it...${NC}"
        $DOCKER_COMPOSE_CMD up -d admin-panel
        sleep 5
    fi
else
    echo -e "${YELLOW}Admin panel container not found. Starting all services...${NC}"
    $DOCKER_COMPOSE_CMD up -d
    sleep 5
fi

echo -e "\n${YELLOW}Step 3: Checking if admin-panel is accessible on port 5173...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ Admin panel is responding on localhost:5173${NC}"
else
    echo -e "${RED}✗ Admin panel is NOT responding on localhost:5173${NC}"
    echo -e "${YELLOW}Checking container logs...${NC}"
    $DOCKER_COMPOSE_CMD logs --tail=50 admin-panel

    echo -e "\n${YELLOW}Attempting to restart admin-panel container...${NC}"
    $DOCKER_COMPOSE_CMD restart admin-panel
    sleep 10

    echo -e "${YELLOW}Rechecking...${NC}"
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✓ Admin panel is now responding${NC}"
    else
        echo -e "${RED}✗ Admin panel still not responding. Rebuilding...${NC}"
        $DOCKER_COMPOSE_CMD up -d --build admin-panel
        sleep 15

        if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200\|301\|302"; then
            echo -e "${GREEN}✓ Admin panel is now responding after rebuild${NC}"
        else
            echo -e "${RED}✗ Admin panel still not responding. Check logs above.${NC}"
            exit 1
        fi
    fi
fi

echo -e "\n${YELLOW}Step 4: Checking nginx configuration...${NC}"
if [ -f "/etc/nginx/sites-enabled/smokava" ] || [ -f "/etc/nginx/sites-enabled/admin.smokava.com" ]; then
    echo -e "${GREEN}✓ Nginx config found${NC}"

    # Check if nginx config has correct proxy_pass
    if grep -q "proxy_pass http://localhost:5173" /etc/nginx/sites-enabled/* 2>/dev/null; then
        echo -e "${GREEN}✓ Nginx config has correct proxy_pass to localhost:5173${NC}"
    else
        echo -e "${YELLOW}⚠ Nginx config might not have correct proxy_pass. Checking...${NC}"
    fi

    echo -e "${YELLOW}Testing nginx configuration...${NC}"
    if nginx -t 2>/dev/null; then
        echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
        echo -e "${YELLOW}Reloading nginx...${NC}"
        systemctl reload nginx || service nginx reload
        echo -e "${GREEN}✓ Nginx reloaded${NC}"
    else
        echo -e "${RED}✗ Nginx configuration has errors!${NC}"
        nginx -t
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Nginx config not found in sites-enabled. You may need to:${NC}"
    echo "  1. Copy nginx/smokava-docker.conf to /etc/nginx/sites-available/smokava"
    echo "  2. Update server_name to admin.smokava.com"
    echo "  3. Create symlink: ln -s /etc/nginx/sites-available/smokava /etc/nginx/sites-enabled/"
    echo "  4. Test: nginx -t"
    echo "  5. Reload: systemctl reload nginx"
fi

echo -e "\n${YELLOW}Step 5: Final health check...${NC}"
sleep 2

# Check if we can reach the admin panel through nginx (if nginx is configured)
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ Admin panel is accessible on localhost:5173${NC}"
    echo -e "${GREEN}✓ Fix complete! Try accessing https://admin.smokava.com now${NC}"
else
    echo -e "${RED}✗ Admin panel still not accessible. Check the logs above.${NC}"
    echo -e "${YELLOW}Recent admin-panel logs:${NC}"
    $DOCKER_COMPOSE_CMD logs --tail=30 admin-panel
    exit 1
fi

echo -e "\n${GREEN}=== Fix Complete ===${NC}"
echo -e "If you still see 502 errors, check:"
echo -e "  1. Docker containers: ${DOCKER_COMPOSE_CMD} ps"
echo -e "  2. Admin panel logs: ${DOCKER_COMPOSE_CMD} logs admin-panel"
echo -e "  3. Nginx logs: tail -f /var/log/nginx/error.log"
echo -e "  4. Nginx access: tail -f /var/log/nginx/access.log"
