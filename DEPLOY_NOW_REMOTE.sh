#!/bin/bash

# Remote Deployment Script
# Run this from your local machine to deploy to production server

SERVER="root@91.107.241.245"
PROJECT_DIR="/opt/smokava"

echo "🚀 Deploying to production server..."
echo "Server: $SERVER"
echo ""

# Deploy via SSH
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 "$SERVER" << 'ENDSSH'
cd /opt/smokava
echo "📥 Pulling latest code..."
git pull
echo "🔧 Running fix script..."
sudo bash scripts/fix-production-502.sh
ENDSSH

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Test your sites:"
echo "  - https://api.smokava.com/api/health"
echo "  - https://smokava.com"
echo "  - https://admin.smokava.com"

