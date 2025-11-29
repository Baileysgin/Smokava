#!/bin/bash

# Deploy Package Feature Fields Fix
# This script deploys the fix for package feature fields not loading

set -e

echo "🚀 Deploying Package Feature Fields Fix..."

# Server details
SERVER="root@91.107.241.245"
SSH_PASS="pqwRU4qhpVW7"
REMOTE_DIR="/opt/smokava"

# Files to deploy
FILES=(
  "backend/routes/admin.js"
)

# Deploy files
echo "📦 Copying files to server..."
for file in "${FILES[@]}"; do
  echo "  - Copying $file..."
  sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$file" "$SERVER:$REMOTE_DIR/$file" || {
    echo "⚠️  Failed to copy $file, will try again..."
    sleep 2
    sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$file" "$SERVER:$REMOTE_DIR/$file"
  }
done

echo "✅ Files copied successfully"

# Restart backend
echo "🔄 Restarting backend service..."
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SERVER" "cd $REMOTE_DIR && docker compose restart backend" || {
  echo "⚠️  Failed to restart, trying rebuild..."
  sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SERVER" "cd $REMOTE_DIR && docker compose stop backend && docker compose build backend && docker compose up -d backend"
}

echo "✅ Backend restarted"

# Check status
echo "🔍 Checking backend status..."
sleep 3
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SERVER" "docker ps | grep smokava-backend" || echo "⚠️  Backend container not found"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test editing a package in admin panel"
echo "2. Fill in the feature fields (ویژگی استفاده, ویژگی اعتبار, ویژگی پشتیبانی)"
echo "3. Save and reload the package"
echo "4. Verify the fields are now loaded correctly"
