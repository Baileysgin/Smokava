#!/bin/bash

# Setup GitHub Actions SSH Key for Deployment
# This script helps you generate and configure SSH keys for GitHub Actions

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SSH_KEY_NAME="github_actions_smokava"
SSH_KEY_PATH="$HOME/.ssh/$SSH_KEY_NAME"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  GITHUB ACTIONS SSH KEY SETUP${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check if key already exists
if [ -f "$SSH_KEY_PATH" ]; then
    echo -e "${YELLOW}⚠️  SSH key already exists at: $SSH_KEY_PATH${NC}"
    read -p "Do you want to use the existing key? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Generating new key...${NC}"
        rm -f "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
    else
        echo -e "${GREEN}✅ Using existing key${NC}"
        SKIP_GENERATION=true
    fi
fi

# Step 2: Generate SSH key if needed
if [ "$SKIP_GENERATION" != "true" ]; then
    echo -e "${BLUE}Step 1: Generating SSH key...${NC}"
    
    # Ensure .ssh directory exists
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    
    # Generate key
    ssh-keygen -t ed25519 -C "github-actions-smokava" -f "$SSH_KEY_PATH" -N ""
    
    echo -e "${GREEN}✅ SSH key generated${NC}"
    echo ""
fi

# Step 3: Display public key
echo -e "${BLUE}Step 2: Your public key (add this to your server):${NC}"
echo -e "${YELLOW}========================================${NC}"
cat "$SSH_KEY_PATH.pub"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Step 4: Instructions for adding to server
echo -e "${BLUE}Step 3: Add public key to your server${NC}"
echo ""
read -p "Enter your server connection (e.g., root@91.107.241.245): " SERVER_HOST

if [ -z "$SERVER_HOST" ]; then
    echo -e "${RED}❌ Server host is required${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Attempting to add public key to server...${NC}"

# Try to add key to server
if ssh-copy-id -i "$SSH_KEY_PATH.pub" -o StrictHostKeyChecking=no "$SERVER_HOST" 2>/dev/null; then
    echo -e "${GREEN}✅ Public key added to server successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Could not automatically add key. Please add manually:${NC}"
    echo ""
    echo "Run this command:"
    echo "  ssh-copy-id -i $SSH_KEY_PATH.pub $SERVER_HOST"
    echo ""
    echo "Or manually add this line to ~/.ssh/authorized_keys on your server:"
    cat "$SSH_KEY_PATH.pub"
    echo ""
    read -p "Press Enter after you've added the key to the server..."
fi

# Step 5: Test SSH connection
echo ""
echo -e "${BLUE}Step 4: Testing SSH connection...${NC}"
if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SERVER_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection test passed!${NC}"
else
    echo -e "${RED}❌ SSH connection test failed${NC}"
    echo -e "${YELLOW}Please check:" && echo "  1. Public key is added to server" && echo "  2. Server host is correct" && echo "  3. Server allows SSH connections"
    exit 1
fi

# Step 6: Display private key for GitHub
echo ""
echo -e "${BLUE}Step 5: Add private key to GitHub Secrets${NC}"
echo ""
echo -e "${YELLOW}Your private key (copy this ENTIRE output):${NC}"
echo -e "${YELLOW}========================================${NC}"
cat "$SSH_KEY_PATH"
echo -e "${YELLOW}========================================${NC}"
echo ""

echo -e "${BLUE}Instructions:${NC}"
echo "1. Go to: https://github.com/Baileysgin/Smokava/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Name: SSH_PRIVATE_KEY"
echo "4. Value: Paste the ENTIRE private key above (including -----BEGIN and -----END lines)"
echo "5. Click 'Add secret'"
echo ""

# Step 7: Check for SSH_HOST secret
echo -e "${BLUE}Step 6: Add SSH_HOST secret${NC}"
echo ""
echo -e "${YELLOW}Also add this secret to GitHub:${NC}"
echo "1. Go to: https://github.com/Baileysgin/Smokava/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Name: SSH_HOST"
echo "4. Value: $SERVER_HOST"
echo "5. Click 'Add secret'"
echo ""

read -p "Press Enter after you've added both secrets to GitHub..."

# Step 7: Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SETUP COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}✅ SSH key generated${NC}"
echo -e "${GREEN}✅ Public key added to server${NC}"
echo -e "${GREEN}✅ SSH connection tested${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Verify secrets are added to GitHub"
echo "2. Go to: https://github.com/Baileysgin/Smokava/actions"
echo "3. Click 'Re-run jobs' on the failed workflow"
echo "4. Or push a new commit to trigger deployment"
echo ""
echo -e "${YELLOW}Your SSH key location:${NC}"
echo "  Private: $SSH_KEY_PATH"
echo "  Public:  $SSH_KEY_PATH.pub"
echo ""

