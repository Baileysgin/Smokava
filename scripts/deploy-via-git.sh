#!/bin/bash

# Deploy via Git Pull - Most Reliable Method
# This script connects to the server and pulls the latest changes

set -e

echo "🚀 Deploying via Git Pull Method..."
echo ""

# Server details
SERVER="root@91.107.241.245"
SSH_PASS="pqwRU4qhpVW7"
REMOTE_DIR="/opt/smokava"

# Function to run SSH command with retries
run_ssh() {
    local cmd="$1"
    local max_attempts=3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        echo "  Attempt $attempt/$max_attempts..."
        if sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=20 -o ServerAliveInterval=60 "$SERVER" "$cmd"; then
            return 0
        fi
        echo "  ⚠️  Attempt $attempt failed, retrying in 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    done

    echo "  ❌ All attempts failed"
    return 1
}

echo "📥 Step 1: Pulling latest changes from Git..."
run_ssh "cd $REMOTE_DIR && git pull origin main" || {
    echo "❌ Failed to pull from git"
    exit 1
}

echo ""
echo "🔄 Step 2: Restarting backend service..."
run_ssh "cd $REMOTE_DIR && docker compose restart backend" || {
    echo "⚠️  Restart failed, trying rebuild..."
    run_ssh "cd $REMOTE_DIR && docker compose stop backend && docker compose build backend && docker compose up -d backend"
}

echo ""
echo "🔨 Step 3: Rebuilding admin panel with environment variables..."
run_ssh "cd $REMOTE_DIR && export VITE_API_URL=https://api.smokava.com/api && docker compose build --no-cache admin-panel" || {
    echo "⚠️  Build with --no-cache failed, trying without..."
    run_ssh "cd $REMOTE_DIR && export VITE_API_URL=https://api.smokava.com/api && docker compose build admin-panel"
}

echo ""
echo "🔄 Step 4: Restarting admin panel..."
run_ssh "cd $REMOTE_DIR && docker compose up -d admin-panel"

echo ""
echo "⏳ Step 5: Waiting for services to start..."
sleep 5

echo ""
echo "🔍 Step 6: Checking service status..."
run_ssh "docker ps | grep smokava" || echo "⚠️  Could not check container status"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test admin panel at: https://admin.smokava.com"
echo "2. Test package feature fields in admin panel"
echo "3. Verify all fields load correctly after saving"
