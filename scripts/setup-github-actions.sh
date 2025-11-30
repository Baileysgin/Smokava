#!/bin/bash

# GitHub Actions Setup Script
# This script helps you set up automatic deployment via GitHub Actions

set -e

echo "🔧 GitHub Actions Automatic Deployment Setup"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if SSH key already exists
SSH_KEY_PATH="$HOME/.ssh/github_actions_smokava"
SSH_PUB_KEY_PATH="$HOME/.ssh/github_actions_smokava.pub"

if [ -f "$SSH_KEY_PATH" ]; then
    echo -e "${YELLOW}⚠️  SSH key already exists at: $SSH_KEY_PATH${NC}"
    echo ""
    read -p "Do you want to generate a new key? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Using existing key...${NC}"
    else
        echo -e "${YELLOW}Generating new SSH key...${NC}"
        ssh-keygen -t ed25519 -C "github-actions-smokava" -f "$SSH_KEY_PATH" -N ""
    fi
else
    echo -e "${BLUE}📝 Step 1: Generating SSH key...${NC}"
    ssh-keygen -t ed25519 -C "github-actions-smokava" -f "$SSH_KEY_PATH" -N ""
    echo -e "${GREEN}✅ SSH key generated!${NC}"
    echo ""
fi

# Display public key
echo ""
echo -e "${BLUE}📋 Step 2: Add this public key to your server${NC}"
echo "=============================================="
echo ""
echo -e "${YELLOW}Copy the public key below and add it to your server:${NC}"
echo ""
cat "$SSH_PUB_KEY_PATH"
echo ""
echo ""
echo -e "${BLUE}On your server, run:${NC}"
echo "  mkdir -p ~/.ssh"
echo "  chmod 700 ~/.ssh"
echo "  echo '$(cat "$SSH_PUB_KEY_PATH")' >> ~/.ssh/authorized_keys"
echo "  chmod 600 ~/.ssh/authorized_keys"
echo ""

# Get server info
echo -e "${BLUE}📋 Step 3: Configure GitHub Secrets${NC}"
echo "=============================================="
echo ""
read -p "Enter your server address (e.g., root@91.107.241.245): " SSH_HOST
read -p "Enter your API URL (e.g., https://api.smokava.com): " API_URL

# Display private key
echo ""
echo -e "${BLUE}📋 Step 4: Add these secrets to GitHub${NC}"
echo "=============================================="
echo ""
echo -e "${YELLOW}1. Go to: https://github.com/Baileysgin/Smokava/settings/secrets/actions${NC}"
echo ""
echo -e "${YELLOW}2. Add Secret: SSH_PRIVATE_KEY${NC}"
echo -e "${GREEN}Value:${NC}"
echo "---"
cat "$SSH_KEY_PATH"
echo "---"
echo ""

echo -e "${YELLOW}3. Add Secret: SSH_HOST${NC}"
echo -e "${GREEN}Value:${NC}"
echo "$SSH_HOST"
echo ""

echo -e "${YELLOW}4. Add Secret: API_URL${NC}"
echo -e "${GREEN}Value:${NC}"
echo "$API_URL"
echo ""

# Test connection
echo -e "${BLUE}📋 Step 5: Test SSH connection${NC}"
echo "=============================================="
echo ""
read -p "Do you want to test the SSH connection now? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Testing SSH connection...${NC}"
    if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SSH_HOST" "echo '✅ SSH connection successful!'"; then
        echo -e "${GREEN}✅ SSH connection works!${NC}"
    else
        echo -e "${YELLOW}⚠️  SSH connection failed. Make sure:${NC}"
        echo "  1. Public key is added to server's ~/.ssh/authorized_keys"
        echo "  2. Server address is correct"
        echo "  3. Server allows SSH connections"
    fi
fi

echo ""
echo -e "${GREEN}✅ Setup instructions complete!${NC}"
echo ""
echo -e "${BLUE}📝 Summary:${NC}"
echo "  1. ✅ SSH key generated: $SSH_KEY_PATH"
echo "  2. ⏳ Add public key to server (see instructions above)"
echo "  3. ⏳ Add secrets to GitHub (see instructions above)"
echo "  4. ✅ Test SSH connection (optional)"
echo ""
echo -e "${GREEN}Once secrets are configured, every push to main will automatically deploy!${NC}"
echo ""

