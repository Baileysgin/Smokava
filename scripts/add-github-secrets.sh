#!/bin/bash

# Script to add GitHub Secrets using GitHub CLI
# Requires: gh CLI installed and authenticated

set -e

echo "🔐 Adding GitHub Secrets for Automatic Deployment"
echo "=================================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo ""
    echo "Install it with:"
    echo "  brew install gh"
    echo "  gh auth login"
    echo ""
    echo "Or add secrets manually at:"
    echo "  https://github.com/Baileysgin/Smokava/settings/secrets/actions"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI found and authenticated"
echo ""

# Get values
SSH_KEY_PATH="$HOME/.ssh/github_actions_smokava"
SSH_HOST="root@91.107.241.245"
API_URL="https://api.smokava.com"

# Check if SSH key exists
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ SSH key not found at: $SSH_KEY_PATH"
    exit 1
fi

echo "📋 Adding secrets..."
echo ""

# Add SSH_PRIVATE_KEY
echo "1. Adding SSH_PRIVATE_KEY..."
gh secret set SSH_PRIVATE_KEY < "$SSH_KEY_PATH" && echo "   ✅ SSH_PRIVATE_KEY added" || {
    echo "   ❌ Failed to add SSH_PRIVATE_KEY"
    exit 1
}

# Add SSH_HOST
echo "2. Adding SSH_HOST..."
echo "$SSH_HOST" | gh secret set SSH_HOST && echo "   ✅ SSH_HOST added" || {
    echo "   ❌ Failed to add SSH_HOST"
    exit 1
}

# Add API_URL
echo "3. Adding API_URL..."
echo "$API_URL" | gh secret set API_URL && echo "   ✅ API_URL added" || {
    echo "   ❌ Failed to add API_URL"
    exit 1
}

echo ""
echo "✅ All secrets added successfully!"
echo ""
echo "🧪 Testing deployment..."
echo "   Push code to trigger automatic deployment:"
echo "   ./scripts/push-to-git.sh \"test: Test automatic deployment\""
echo ""
echo "📊 Check deployment status:"
echo "   https://github.com/Baileysgin/Smokava/actions"
echo ""
