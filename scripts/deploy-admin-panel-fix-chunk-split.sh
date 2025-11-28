#!/bin/bash

# Deploy admin panel chunk splitting fix to server
# This script deploys the fixed vite.config.ts and rebuilds the container

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/smokava}"

echo "🚀 Deploying admin panel chunk splitting fix to $SERVER_USER@$SERVER_IP"
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command -v brew &> /dev/null; then
            echo "❌ Please install Homebrew first: https://brew.sh"
            exit 1
        fi
        brew install hudochenkov/sshpass/sshpass 2>/dev/null || echo "⚠️  sshpass installation skipped"
    fi
fi

# Function to execute remote commands
remote_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$@"
    else
        ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$@"
    fi
}

# Function to copy files
remote_copy() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -r "$1" "$SERVER_USER@$SERVER_IP:$2"
    else
        scp -o StrictHostKeyChecking=no -r "$1" "$SERVER_USER@$SERVER_IP:$2"
    fi
}

echo "📦 Step 1: Copying fixed files to server..."
remote_copy "admin-panel/vite.config.ts" "$DEPLOY_DIR/admin-panel/"
remote_copy "admin-panel/src/main.tsx" "$DEPLOY_DIR/admin-panel/src/"

echo "✅ Files copied successfully!"
echo ""

echo "🔧 Step 2: Rebuilding admin-panel container on server..."
remote_exec "cd $DEPLOY_DIR && \
    docker compose build --no-cache admin-panel && \
    docker compose up -d admin-panel"

echo ""
echo "⏳ Waiting for container to start..."
sleep 5

echo ""
echo "📊 Step 3: Checking container status..."
remote_exec "cd $DEPLOY_DIR && docker compose ps admin-panel"

echo ""
echo "📋 Step 4: Checking container logs for errors..."
remote_exec "cd $DEPLOY_DIR && docker compose logs --tail=50 admin-panel"

echo ""
echo "✅ Admin panel fix deployed successfully!"
echo ""
echo "🌐 Admin panel should now be available at:"
echo "   - http://admin.smokava.com"
echo "   - http://91.107.241.245:5173"
echo ""
echo "🔍 To verify the fix:"
echo "   1. Open the admin panel in your browser"
echo "   2. Check the browser console - should have no errors"
echo "   3. The page should load properly without blank screen"
echo ""
echo "Please refresh your browser (Ctrl+Shift+R or Cmd+Shift+R) to clear cache."
