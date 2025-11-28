#!/bin/bash

# Run this script ON THE SERVER to deploy the admin panel fix
# Usage: ./deploy-admin-panel-on-server.sh

set -e

echo "🚀 Deploying Admin Panel Chunk Splitting Fix..."
echo ""

# Navigate to project directory
cd /opt/smokava || { echo "❌ Error: /opt/smokava not found"; exit 1; }

echo "📥 Step 1: Pulling latest changes from GitHub..."
git pull origin main

echo ""
echo "🔧 Step 2: Rebuilding admin-panel container..."
docker compose build --no-cache admin-panel

echo ""
echo "🔄 Step 3: Restarting admin-panel container..."
docker compose up -d admin-panel

echo ""
echo "⏳ Step 4: Waiting for container to start..."
sleep 5

echo ""
echo "📊 Step 5: Checking container status..."
docker compose ps admin-panel

echo ""
echo "📋 Step 6: Checking container logs (last 30 lines)..."
docker compose logs --tail=30 admin-panel

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Admin panel should now be available at:"
echo "   - http://admin.smokava.com"
echo "   - http://91.107.241.245:5173"
echo ""
echo "🔍 To verify the fix:"
echo "   1. Open the admin panel in your browser"
echo "   2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "   3. Check the browser console - should have no errors"
echo "   4. The page should load properly without blank screen"
echo ""
