#!/bin/bash

# Add GitHub Secrets using GitHub API
# This script uses a GitHub Personal Access Token to add secrets

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO="Baileysgin/Smokava"
SSH_KEY_PATH="$HOME/.ssh/github_actions_smokava"
SSH_HOST="root@91.107.241.245"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ADD GITHUB SECRETS VIA API${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check for GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_TOKEN not set${NC}"
    echo ""
    echo "To add secrets automatically, you need a GitHub Personal Access Token:"
    echo ""
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token' → 'Generate new token (classic)'"
    echo "3. Name: 'Smokava Secrets'"
    echo "4. Scopes: Check 'repo' (Full control of private repositories)"
    echo "5. Click 'Generate token'"
    echo "6. Copy the token"
    echo ""
    echo "Then run:"
    echo "  export GITHUB_TOKEN=your_token_here"
    echo "  ./scripts/add-secrets-via-api.sh"
    echo ""
    exit 1
fi

# Check if required tools are available
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not found. Installing...${NC}"
    if command -v brew &> /dev/null; then
        brew install jq
    else
        echo -e "${RED}❌ Please install jq: brew install jq${NC}"
        exit 1
    fi
fi

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ openssl not found${NC}"
    exit 1
fi

# Check if SSH key exists
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo -e "${RED}❌ SSH key not found at: $SSH_KEY_PATH${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1: Getting repository public key...${NC}"

# Get repository public key
REPO_KEY_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO/actions/secrets/public-key")

REPO_KEY=$(echo "$REPO_KEY_RESPONSE" | jq -r '.key')
REPO_KEY_ID=$(echo "$REPO_KEY_RESPONSE" | jq -r '.key_id')

if [ "$REPO_KEY" == "null" ] || [ -z "$REPO_KEY" ]; then
    echo -e "${RED}❌ Failed to get repository public key${NC}"
    echo "Response: $REPO_KEY_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Got repository public key${NC}"

echo ""
echo -e "${BLUE}Step 2: Encrypting SSH_PRIVATE_KEY...${NC}"

# Read and encrypt SSH private key
SSH_PRIVATE_KEY=$(cat "$SSH_KEY_PATH")
ENCRYPTED_KEY=$(echo -n "$SSH_PRIVATE_KEY" | openssl pkeyutl -encrypt -pubin -inkey <(echo "$REPO_KEY" | base64 -d) -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 | base64 -w 0)

if [ -z "$ENCRYPTED_KEY" ]; then
    echo -e "${RED}❌ Failed to encrypt SSH private key${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SSH private key encrypted${NC}"

echo ""
echo -e "${BLUE}Step 3: Adding SSH_PRIVATE_KEY secret...${NC}"

# Add SSH_PRIVATE_KEY secret
SSH_KEY_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO/actions/secrets/SSH_PRIVATE_KEY" \
    -d "{\"encrypted_value\":\"$ENCRYPTED_KEY\",\"key_id\":\"$REPO_KEY_ID\"}")

HTTP_CODE=$(echo "$SSH_KEY_RESPONSE" | tail -1)
if [ "$HTTP_CODE" == "204" ] || [ "$HTTP_CODE" == "201" ]; then
    echo -e "${GREEN}✅ SSH_PRIVATE_KEY secret added successfully${NC}"
else
    echo -e "${RED}❌ Failed to add SSH_PRIVATE_KEY secret${NC}"
    echo "HTTP Code: $HTTP_CODE"
    echo "Response: $SSH_KEY_RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 4: Encrypting SSH_HOST...${NC}"

# Encrypt SSH_HOST
ENCRYPTED_HOST=$(echo -n "$SSH_HOST" | openssl pkeyutl -encrypt -pubin -inkey <(echo "$REPO_KEY" | base64 -d) -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 | base64 -w 0)

echo -e "${GREEN}✅ SSH_HOST encrypted${NC}"

echo ""
echo -e "${BLUE}Step 5: Adding SSH_HOST secret...${NC}"

# Add SSH_HOST secret
SSH_HOST_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO/actions/secrets/SSH_HOST" \
    -d "{\"encrypted_value\":\"$ENCRYPTED_HOST\",\"key_id\":\"$REPO_KEY_ID\"}")

HTTP_CODE=$(echo "$SSH_HOST_RESPONSE" | tail -1)
if [ "$HTTP_CODE" == "204" ] || [ "$HTTP_CODE" == "201" ]; then
    echo -e "${GREEN}✅ SSH_HOST secret added successfully${NC}"
else
    echo -e "${YELLOW}⚠️  SSH_HOST might already exist (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SECRETS ADDED SUCCESSFULLY!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Go to: https://github.com/$REPO/actions"
echo "2. Click 'Re-run jobs' on the failed workflow"
echo "3. ✅ Deployment will start automatically!"
echo ""

