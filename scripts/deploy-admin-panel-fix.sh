#!/bin/bash

# Deploy admin panel React fix to server
# This script deploys only the admin-panel package.json changes

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/smokava}"

echo "🚀 Deploying admin panel React fix to $SERVER_USER@$SERVER_IP"

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

echo "📦 Copying updated admin-panel files..."
remote_copy "admin-panel/package.json" "$DEPLOY_DIR/admin-panel/"
remote_copy "admin-panel/package-lock.json" "$DEPLOY_DIR/admin-panel/"

echo "🔧 Rebuilding admin-panel container on server..."
remote_exec "cd $DEPLOY_DIR && \
    cd admin-panel && \
    docker compose build --no-cache admin-panel && \
    docker compose up -d admin-panel"

echo "✅ Admin panel fix deployed successfully!"
echo ""
echo "🌐 Admin panel should now be available at:"
echo "   - http://admin.smokava.com"
echo "   - http://91.107.241.245:5173"
echo ""
echo "Please refresh your browser to see the fix."

