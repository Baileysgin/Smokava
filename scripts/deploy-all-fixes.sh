#!/bin/bash

# Deploy All Fixes Script
# This script deploys both the backend package feature fields fix and admin panel fix

set -e

echo "🚀 Deploying All Fixes..."
echo ""

# Server details
SERVER="root@91.107.241.245"
SSH_PASS="pqwRU4qhpVW7"
REMOTE_DIR="/opt/smokava"

# Function to run SSH command with retries
run_ssh() {
    local cmd="$1"
    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        echo "  Attempt $attempt/$max_attempts..."
        if sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -o ServerAliveInterval=60 "$SERVER" "$cmd"; then
            return 0
        fi
        echo "  ⚠️  Attempt $attempt failed, retrying in 3 seconds..."
        sleep 3
        attempt=$((attempt + 1))
    done

    echo "  ❌ All attempts failed"
    return 1
}

# Function to copy file with retries
copy_file() {
    local file="$1"
    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        echo "  Copying $file (attempt $attempt/$max_attempts)..."
        if sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no -o ConnectTimeout=15 -o ServerAliveInterval=60 "$file" "$SERVER:$REMOTE_DIR/$file"; then
            echo "  ✅ $file copied successfully"
            return 0
        fi
        echo "  ⚠️  Attempt $attempt failed, retrying in 3 seconds..."
        sleep 3
        attempt=$((attempt + 1))
    done

    echo "  ❌ Failed to copy $file after $max_attempts attempts"
    return 1
}

# Step 1: Deploy Backend Fix
echo "📦 Step 1: Deploying Package Feature Fields Fix (Backend)..."
echo "  Copying backend/routes/admin.js..."
if copy_file "backend/routes/admin.js"; then
    echo "✅ Backend file copied"
else
    echo "❌ Failed to copy backend file"
    exit 1
fi

# Step 2: Deploy Admin Panel Fix
echo ""
echo "📦 Step 2: Deploying Admin Panel API Configuration Fix..."
ADMIN_FILES=(
    "admin-panel/src/lib/api.ts"
    "admin-panel/vite.config.ts"
    "admin-panel/Dockerfile"
    "docker-compose.yml"
)

for file in "${ADMIN_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  Copying $file..."
        copy_file "$file" || echo "  ⚠️  Warning: Failed to copy $file"
    else
        echo "  ⚠️  Warning: File not found: $file"
    fi
done

# Step 3: Restart Backend
echo ""
echo "🔄 Step 3: Restarting backend service..."
run_ssh "cd $REMOTE_DIR && docker compose restart backend" || {
    echo "⚠️  Restart failed, trying rebuild..."
    run_ssh "cd $REMOTE_DIR && docker compose stop backend && docker compose build backend && docker compose up -d backend"
}

# Step 4: Rebuild and Restart Admin Panel
echo ""
echo "🔨 Step 4: Rebuilding admin panel..."
run_ssh "cd $REMOTE_DIR && export VITE_API_URL=https://api.smokava.com/api && docker compose build --no-cache admin-panel" || {
    echo "⚠️  Build failed, trying without --no-cache..."
    run_ssh "cd $REMOTE_DIR && export VITE_API_URL=https://api.smokava.com/api && docker compose build admin-panel"
}

echo ""
echo "🔄 Step 5: Restarting admin panel..."
run_ssh "cd $REMOTE_DIR && docker compose up -d admin-panel"

# Step 5: Wait and check status
echo ""
echo "⏳ Step 6: Waiting for services to start..."
sleep 5

echo ""
echo "🔍 Step 7: Checking service status..."
run_ssh "docker ps | grep smokava" || echo "⚠️  Could not check container status"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test admin panel at: https://admin.smokava.com"
echo "2. Test package feature fields in admin panel"
echo "3. Verify all fields load correctly after saving"

