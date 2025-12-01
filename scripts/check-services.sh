#!/bin/bash

# ===========================================
# SERVICE HEALTH CHECK SCRIPT
# ===========================================
# Checks if all Docker services are running and healthy

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="${PROJECT_DIR:-/opt/smokava}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SERVICE HEALTH CHECK${NC}"
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

# Check container status
echo -e "${BLUE}Checking container status...${NC}"
$DOCKER_COMPOSE_CMD ps

echo ""
echo -e "${BLUE}Checking service health...${NC}"

# Check MongoDB
echo -n "MongoDB: "
if docker exec smokava-mongodb mongosh --quiet --eval "db.runCommand('ping').ok" smokava 2>/dev/null | grep -q "1"; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy or not running${NC}"
fi

# Check Backend
echo -n "Backend (port 5000): "
if curl -f -s --max-time 5 "http://localhost:5000/api/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy or not running${NC}"
    echo -e "${YELLOW}   Checking container logs...${NC}"
    docker logs --tail 20 smokava-backend 2>&1 | tail -5
fi

# Check Frontend
echo -n "Frontend (port 3000): "
if curl -f -s --max-time 5 "http://localhost:3000" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy or not running${NC}"
    echo -e "${YELLOW}   Checking container logs...${NC}"
    docker logs --tail 20 smokava-frontend 2>&1 | tail -5
fi

# Check Admin Panel
echo -n "Admin Panel (port 5173): "
if curl -f -s --max-time 5 "http://localhost:5173" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy or not running${NC}"
    echo -e "${YELLOW}   Checking container logs...${NC}"
    docker logs --tail 20 smokava-admin-panel 2>&1 | tail -5
fi

echo ""
echo -e "${BLUE}Checking port bindings...${NC}"

# Check if ports are bound
PORTS=(27017 5000 3000 5173)
for PORT in "${PORTS[@]}"; do
    if netstat -tuln 2>/dev/null | grep -q ":$PORT " || ss -tuln 2>/dev/null | grep -q ":$PORT "; then
        echo -e "${GREEN}✅ Port $PORT is bound${NC}"
    else
        echo -e "${RED}❌ Port $PORT is not bound${NC}"
    fi
done

echo ""
echo -e "${BLUE}Checking container restart counts...${NC}"
$DOCKER_COMPOSE_CMD ps --format "table {{.Name}}\t{{.Status}}\t{{.Restarts}}"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Health check complete${NC}"
