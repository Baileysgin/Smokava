#!/bin/bash

# Quick Deployment Script
# This script helps deploy to production with SSH

set -e

PRODUCTION_SERVER="91.107.241.245"
PROJECT_DIR="/opt/smokava"

echo "🚀 Smokava Production Deployment"
echo "================================"
echo ""
echo "Server: ${PRODUCTION_SERVER}"
echo "Project: ${PROJECT_DIR}"
echo ""

# Check if SSH key exists
if [ -f ~/.ssh/id_rsa ] || [ -f ~/.ssh/id_ed25519 ]; then
    echo "✅ SSH key found"
    SSH_KEY_OPTION=""
    if [ -f ~/.ssh/id_rsa ]; then
        SSH_KEY_OPTION="-i ~/.ssh/id_rsa"
    elif [ -f ~/.ssh/id_ed25519 ]; then
        SSH_KEY_OPTION="-i ~/.ssh/id_ed25519"
    fi
else
    echo "⚠️  No SSH key found - will prompt for password"
    SSH_KEY_OPTION=""
fi

echo ""
echo "Deploying to production..."
echo ""

# Deploy command
DEPLOY_CMD="cd ${PROJECT_DIR} && git pull origin main && sudo bash scripts/deploy-safe.sh"

# Try to deploy
if ssh ${SSH_KEY_OPTION} -o ConnectTimeout=10 root@${PRODUCTION_SERVER} "${DEPLOY_CMD}"; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "Verifying deployment..."
    sleep 5
    curl -s https://api.smokava.com/api/health | head -5 || echo "Health check endpoint not yet available"
else
    echo ""
    echo "❌ Deployment failed or requires manual authentication"
    echo ""
    echo "Please run manually:"
    echo "  ssh root@${PRODUCTION_SERVER}"
    echo "  cd ${PROJECT_DIR}"
    echo "  git pull origin main"
    echo "  sudo bash scripts/deploy-safe.sh"
    exit 1
fi
