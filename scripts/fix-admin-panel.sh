#!/bin/bash

# Comprehensive Admin Panel Fix Script
# This script rebuilds the admin panel with correct environment variables

set -e

echo "🔧 Starting Admin Panel Fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi

# Set default API URL if not provided
VITE_API_URL=${VITE_API_URL:-https://api.smokava.com/api}

echo -e "${YELLOW}📦 Using API URL: ${VITE_API_URL}${NC}"

# Export for docker-compose
export VITE_API_URL

# Stop and remove existing admin panel container
echo -e "${YELLOW}🛑 Stopping existing admin panel container...${NC}"
docker compose stop admin-panel 2>/dev/null || true
docker compose rm -f admin-panel 2>/dev/null || true

# Rebuild admin panel with new environment
echo -e "${YELLOW}🔨 Rebuilding admin panel...${NC}"
docker compose build --no-cache admin-panel

# Start admin panel
echo -e "${YELLOW}🚀 Starting admin panel...${NC}"
docker compose up -d admin-panel

# Wait for container to be ready
echo -e "${YELLOW}⏳ Waiting for admin panel to be ready...${NC}"
sleep 5

# Check container status
if docker ps | grep -q smokava-admin-panel; then
    echo -e "${GREEN}✅ Admin panel container is running${NC}"
else
    echo -e "${RED}❌ Admin panel container failed to start${NC}"
    docker compose logs admin-panel
    exit 1
fi

# Verify API URL in built files (if possible)
echo -e "${YELLOW}🔍 Verifying build...${NC}"
docker exec smokava-admin-panel ls -la /usr/share/nginx/html 2>/dev/null || echo "Container not fully ready yet"

echo -e "${GREEN}✅ Admin panel fix complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Check admin panel at: https://admin.smokava.com"
echo "2. Verify API calls in browser console"
echo "3. Test login and data loading"

