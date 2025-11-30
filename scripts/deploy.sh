#!/bin/bash

# Safe Deployment Script for Smokava
# This script safely deploys the application without destroying the database

set -e

echo "🚀 Starting Smokava deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Step 1: Create backup
echo -e "${YELLOW}📦 Step 1: Creating database backup...${NC}"
if [ -f "scripts/db-backup.sh" ]; then
    bash scripts/db-backup.sh || echo -e "${YELLOW}⚠️  Backup failed, continuing anyway...${NC}"
else
    echo -e "${YELLOW}⚠️  Backup script not found, skipping backup...${NC}"
fi

# Step 2: Pull latest code (if git repo)
if [ -d ".git" ]; then
    echo -e "${YELLOW}📥 Step 2: Pulling latest code...${NC}"
    git pull origin main || echo -e "${YELLOW}⚠️  Git pull failed, continuing with current code...${NC}"
else
    echo -e "${YELLOW}⚠️  Not a git repository, skipping pull...${NC}"
fi

# Step 3: Build and deploy services (without recreating volumes)
echo -e "${YELLOW}🔨 Step 3: Building and deploying services...${NC}"

# Deploy backend
echo -e "${GREEN}→ Deploying backend...${NC}"
docker-compose build backend
docker-compose up -d --no-deps backend

# Deploy frontend
echo -e "${GREEN}→ Deploying frontend...${NC}"
docker-compose build frontend
docker-compose up -d --no-deps frontend

# Deploy admin panel
echo -e "${GREEN}→ Deploying admin panel...${NC}"
docker-compose build admin-panel
docker-compose up -d --no-deps admin-panel

# Step 4: Wait for services to start
echo -e "${YELLOW}⏳ Step 4: Waiting for services to start...${NC}"
sleep 10

# Step 5: Health check
echo -e "${YELLOW}🏥 Step 5: Running health checks...${NC}"

# Check backend health
if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo -e "${YELLOW}Checking logs...${NC}"
    docker-compose logs --tail=50 backend
    exit 1
fi

# Check if services are running
echo -e "${YELLOW}📊 Checking service status...${NC}"
docker-compose ps

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}Services are running:${NC}"
echo "  - Backend: http://localhost:5001"
echo "  - Frontend: http://localhost:3000"
echo "  - Admin Panel: http://localhost:5173"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "  docker-compose logs -f [service-name]"
echo ""
echo -e "${YELLOW}To check health:${NC}"
echo "  curl http://localhost:5001/api/health"

