#!/bin/bash

# Production Deployment Script
# This script commits changes, pushes to git, and deploys to production server

set -e

# Configuration
PRODUCTION_SERVER="91.107.241.245"
PROJECT_DIR="/opt/smokava"
GIT_BRANCH="${GIT_BRANCH:-main}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Production Deployment Process ===${NC}"
echo ""

# Step 1: Check git status
echo -e "${YELLOW}Step 1: Checking git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo "Changes detected. Committing..."
    git add .
    git commit -m "feat: Add role management, moderation, time windows, and deployment scripts

- Add role management system with UserRole model
- Add moderation endpoints and UI
- Add time-windowed packages with Persian error messages
- Fix restaurant count and shisha usage counters
- Add health check endpoints
- Add PWA install prompt improvements
- Add public profile share button
- Add safe deployment scripts
- Add backup and restore scripts
- Update documentation"
    echo -e "${GREEN}✓ Changes committed${NC}"
else
    echo -e "${GREEN}✓ No changes to commit${NC}"
fi

# Step 2: Push to git
echo ""
echo -e "${YELLOW}Step 2: Pushing to git repository...${NC}"
git push origin ${GIT_BRANCH} || {
    echo -e "${RED}Error: Failed to push to git${NC}"
    echo "Please check your git credentials and try again"
    exit 1
}
echo -e "${GREEN}✓ Changes pushed to git${NC}"

# Step 3: Deploy to production server
echo ""
echo -e "${YELLOW}Step 3: Deploying to production server...${NC}"
echo "Server: ${PRODUCTION_SERVER}"
echo "Project: ${PROJECT_DIR}"
echo ""

# Check if SSH key is available
if [ -z "$SSH_KEY" ]; then
    SSH_KEY="$HOME/.ssh/id_rsa"
fi

# Deploy command
DEPLOY_CMD="cd ${PROJECT_DIR} && git pull origin ${GIT_BRANCH} && sudo bash scripts/deploy-safe.sh"

echo "Running deployment on production server..."
echo "Command: ${DEPLOY_CMD}"
echo ""

# Try to deploy via SSH
if command -v ssh >/dev/null 2>&1; then
    ssh -o StrictHostKeyChecking=no root@${PRODUCTION_SERVER} "${DEPLOY_CMD}" || {
        echo -e "${RED}Error: SSH deployment failed${NC}"
        echo ""
        echo "Please run manually on production server:"
        echo "  ssh root@${PRODUCTION_SERVER}"
        echo "  cd ${PROJECT_DIR}"
        echo "  git pull origin ${GIT_BRANCH}"
        echo "  sudo bash scripts/deploy-safe.sh"
        exit 1
    }
    echo -e "${GREEN}✓ Deployment completed on production server${NC}"
else
    echo -e "${YELLOW}SSH not available. Please deploy manually:${NC}"
    echo ""
    echo "1. SSH to production server:"
    echo "   ssh root@${PRODUCTION_SERVER}"
    echo ""
    echo "2. Run deployment:"
    echo "   cd ${PROJECT_DIR}"
    echo "   git pull origin ${GIT_BRANCH}"
    echo "   sudo bash scripts/deploy-safe.sh"
    echo ""
    exit 0
fi

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Verify deployment:"
echo "  curl https://api.smokava.com/api/health"
echo "  curl -H 'Authorization: Bearer TOKEN' https://api.smokava.com/api/admin/health"

