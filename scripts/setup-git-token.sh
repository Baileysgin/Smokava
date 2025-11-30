#!/bin/bash

# Setup Git Personal Access Token for Automatic Pulls
# This script configures git credential helper and guides you through token setup

set -e

echo "🔐 Setting up Git Personal Access Token for Automatic Pulls"
echo ""

# Server details
SERVER="root@91.107.241.245"
SSH_PASS="pqwRU4qhpVW7"
REMOTE_DIR="/opt/smokava"

# Function to run SSH command
run_ssh() {
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=20 "$SERVER" "$1"
}

echo "📋 Step 1: Configure Git Credential Helper on Server..."
run_ssh "git config --global credential.helper store" || {
    echo "⚠️  Failed to set credential helper"
    exit 1
}
echo "✅ Credential helper configured"

echo ""
echo "📝 Step 2: Create Personal Access Token on GitHub"
echo ""
echo "Please follow these steps:"
echo "1. Open: https://github.com/settings/tokens"
echo "2. Click: 'Generate new token' > 'Generate new token (classic)'"
echo "3. Name: 'Smokava Server Deploy'"
echo "4. Expiration: Choose 'No expiration' or set a long date"
echo "5. Select scope: Check 'repo' (Full control of private repositories)"
echo "6. Click: 'Generate token'"
echo "7. COPY THE TOKEN (you won't see it again!)"
echo ""
read -p "Have you created and copied the token? (y/n): " token_ready

if [ "$token_ready" != "y" ] && [ "$token_ready" != "Y" ]; then
    echo "❌ Please create the token first, then run this script again"
    exit 1
fi

echo ""
echo "🔑 Step 3: Enter your GitHub username and token"
read -p "GitHub Username [Baileysgin]: " github_user
github_user=${github_user:-Baileysgin}
read -sp "Personal Access Token: " github_token
echo ""

if [ -z "$github_token" ]; then
    echo "❌ Token cannot be empty"
    exit 1
fi

echo ""
echo "📤 Step 4: Testing git pull with token..."
echo "This will cache your credentials automatically"

# Create credential string
credential_string="https://${github_user}:${github_token}@github.com"

# Write credentials to server
run_ssh "echo '$credential_string' > ~/.git-credentials && chmod 600 ~/.git-credentials" || {
    echo "❌ Failed to save credentials"
    exit 1
}

echo "✅ Credentials saved securely"

echo ""
echo "🧪 Step 5: Testing git pull..."
run_ssh "cd $REMOTE_DIR && git pull origin main" || {
    echo "❌ Git pull failed. Please check:"
    echo "   - Token has 'repo' scope"
    echo "   - Token hasn't expired"
    echo "   - Username is correct"
    exit 1
}

echo ""
echo "✅ Git is now configured for automatic pulls!"
echo ""
echo "📋 Summary:"
echo "  - Credential helper: ✅ Configured"
echo "  - Credentials: ✅ Saved"
echo "  - Test pull: ✅ Successful"
echo ""
echo "🚀 You can now deploy using:"
echo "   ./scripts/deploy-to-server.sh"
echo ""
echo "💡 Note: The token is stored in ~/.git-credentials on the server"
echo "   It will be used automatically for all git operations"

