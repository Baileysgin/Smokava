#!/bin/bash

# Automatically add GitHub secrets using GitHub CLI
# This script will authenticate and add SSH secrets

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SSH_KEY_PATH="$HOME/.ssh/github_actions_smokava"
SSH_HOST="root@91.107.241.245"
REPO="Baileysgin/Smokava"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AUTO-ADD GITHUB SECRETS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it: brew install gh"
    exit 1
fi

# Check authentication
echo -e "${BLUE}Step 1: Checking GitHub authentication...${NC}"
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated. Starting authentication...${NC}"
    echo -e "${YELLOW}Please follow the prompts to authenticate with GitHub${NC}"
    gh auth login
else
    echo -e "${GREEN}✅ Already authenticated${NC}"
fi

# Verify SSH key exists
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo -e "${RED}❌ SSH key not found at: $SSH_KEY_PATH${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Adding SSH_PRIVATE_KEY secret...${NC}"

# Read private key
PRIVATE_KEY=$(cat "$SSH_KEY_PATH")

# Add secret using GitHub CLI
if echo "$PRIVATE_KEY" | gh secret set SSH_PRIVATE_KEY --repo "$REPO" 2>&1; then
    echo -e "${GREEN}✅ SSH_PRIVATE_KEY secret added successfully${NC}"
else
    echo -e "${RED}❌ Failed to add SSH_PRIVATE_KEY secret${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Adding SSH_HOST secret...${NC}"

if echo "$SSH_HOST" | gh secret set SSH_HOST --repo "$REPO" 2>&1; then
    echo -e "${GREEN}✅ SSH_HOST secret added successfully${NC}"
else
    echo -e "${YELLOW}⚠️  SSH_HOST might already exist, or failed to add${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SECRETS ADDED SUCCESSFULLY!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Added secrets:${NC}"
echo "  ✅ SSH_PRIVATE_KEY"
echo "  ✅ SSH_HOST = $SSH_HOST"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Go to: https://github.com/$REPO/actions"
echo "2. Click 'Re-run jobs' on the failed workflow"
echo "3. Or push a new commit to trigger deployment"
echo ""
