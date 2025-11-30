#!/bin/bash

# One-Click Deploy Script
# This script runs health checks, builds, commits, and deploys via GitHub Actions

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ONE-CLICK DEPLOYMENT${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Run pre-deploy health check
echo -e "${BLUE}STEP 1: Running pre-deploy health check...${NC}"
if ! bash scripts/pre-deploy-health-check.sh; then
  echo -e "${RED}❌ Health check failed. Please fix errors before deploying.${NC}"
  exit 1
fi
echo ""

# Step 2: Verify we're on the correct branch
echo -e "${BLUE}STEP 2: Verifying Git branch...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
  echo -e "${YELLOW}⚠️  Warning: Not on main/master branch (current: $CURRENT_BRANCH)${NC}"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo -e "${GREEN}✅ On $CURRENT_BRANCH branch${NC}"
fi
echo ""

# Step 3: Check for uncommitted changes
echo -e "${BLUE}STEP 3: Checking for uncommitted changes...${NC}"
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  Uncommitted changes detected:${NC}"
  git status --short
  echo ""
  read -p "Commit these changes? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add -A
    read -p "Enter commit message (or press Enter for default): " COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
      COMMIT_MSG="chore: Deploy via one-click script - $(date +%Y-%m-%d\ %H:%M:%S)"
    fi
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✅ Changes committed${NC}"
  else
    echo -e "${YELLOW}⚠️  Skipping commit - will deploy current committed state${NC}"
  fi
else
  echo -e "${GREEN}✅ No uncommitted changes${NC}"
fi
echo ""

# Step 4: Verify GitHub remote
echo -e "${BLUE}STEP 4: Verifying GitHub connection...${NC}"
if ! git remote get-url origin | grep -q "github.com"; then
  echo -e "${RED}❌ GitHub remote not configured${NC}"
  exit 1
fi

if ! git ls-remote --heads origin main > /dev/null 2>&1 && ! git ls-remote --heads origin master > /dev/null 2>&1; then
  echo -e "${RED}❌ Cannot access GitHub repository${NC}"
  exit 1
fi

echo -e "${GREEN}✅ GitHub connection verified${NC}"
echo ""

# Step 5: Push to GitHub (this triggers GitHub Actions)
echo -e "${BLUE}STEP 5: Pushing to GitHub...${NC}"
if git push origin "$CURRENT_BRANCH"; then
  echo -e "${GREEN}✅ Code pushed to GitHub${NC}"
  echo -e "${GREEN}✅ GitHub Actions deployment triggered${NC}"
else
  echo -e "${RED}❌ Failed to push to GitHub${NC}"
  exit 1
fi
echo ""

# Step 6: Wait and check deployment status
echo -e "${BLUE}STEP 6: Monitoring deployment...${NC}"
echo -e "${YELLOW}⏳ Waiting 30 seconds for deployment to start...${NC}"
sleep 30

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  DEPLOYMENT INITIATED${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✅ Pre-deploy checks passed${NC}"
echo -e "${GREEN}✅ Code pushed to GitHub${NC}"
echo -e "${GREEN}✅ GitHub Actions workflow triggered${NC}"
echo ""
echo -e "${YELLOW}📊 Monitor deployment at:${NC}"
echo "   https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo ""
echo -e "${YELLOW}🔍 Check server status:${NC}"
echo "   https://api.smokava.com/api/health"
echo ""
echo -e "${GREEN}✅ Deployment process started!${NC}"
