#!/bin/bash

# Git Push Only Script for Smokava
# This script ONLY pushes code to GitHub - it does NOT deploy to server
# Deployment should be done separately via CI/CD or manual server pull

set -e

echo "📤 Pushing Smokava code to GitHub..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not a git repository.${NC}"
    exit 1
fi

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  No changes to commit.${NC}"
    echo -e "${GREEN}✅ Working directory is clean.${NC}"
    exit 0
fi

# Show status
echo -e "${YELLOW}📋 Current status:${NC}"
git status --short
echo ""

# Ask for commit message or use default
if [ -z "$1" ]; then
    echo -e "${YELLOW}Enter commit message (or press Enter for default):${NC}"
    read -r COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="chore: Update code - $(date +'%Y-%m-%d %H:%M:%S')"
    fi
else
    COMMIT_MSG="$1"
fi

# Stage all changes
echo -e "${YELLOW}📦 Staging all changes...${NC}"
git add .

# Commit
echo -e "${YELLOW}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MSG" || {
    echo -e "${RED}❌ Commit failed.${NC}"
    exit 1
}

# Push to GitHub
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
git push origin main || {
    echo -e "${RED}❌ Push failed. Check your git configuration and network connection.${NC}"
    exit 1
}

echo ""
echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Code is now on GitHub (main branch)"
echo "  2. If CI/CD is configured, deployment will trigger automatically"
echo "  3. Or manually deploy on server:"
echo "     ssh user@server 'cd /opt/smokava && git pull && bash scripts/deploy.sh'"
echo ""
echo -e "${GREEN}✅ Push complete!${NC}"
