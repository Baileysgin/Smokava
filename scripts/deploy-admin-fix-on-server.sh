#!/bin/bash

# Run this script ON THE SERVER to deploy the admin panel React fix
# Usage: ./deploy-admin-fix-on-server.sh

set -e

echo "🚀 Deploying Admin Panel React Fix..."
echo ""

# Navigate to project directory
cd /opt/smokava || { echo "❌ Error: /opt/smokava not found"; exit 1; }

echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo ""
echo "🔧 Rebuilding admin-panel container..."
docker compose build --no-cache admin-panel

echo ""
echo "🔄 Restarting admin-panel container..."
docker compose up -d admin-panel

echo ""
echo "⏳ Waiting for container to start..."
sleep 5

echo ""
echo "📊 Checking container status..."
docker compose ps admin-panel

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Admin panel should now be available at:"
echo "   - http://admin.smokava.com"
echo "   - http://91.107.241.245:5173"
echo ""
echo "Please refresh your browser to see the fix."
