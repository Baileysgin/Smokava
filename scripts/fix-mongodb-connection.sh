#!/bin/bash

# Script to fix MongoDB connection issues on server

set -e

SERVER="${SSH_HOST:-root@91.107.241.245}"
REMOTE_DIR="/opt/smokava"

SSH_PASS="${SSH_PASSWORD:-pqwRU4qhpVW7}"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=20"

if [ -n "$SSH_PASS" ] && command -v sshpass > /dev/null 2>&1; then
    SSH_CMD() {
        sshpass -p "$SSH_PASS" ssh $SSH_OPTS "$@"
    }
else
    SSH_CMD() {
        ssh $SSH_OPTS "$@"
    }
fi

echo "🔧 Fixing MongoDB Connection..."
echo ""

# Step 1: Check MongoDB container
echo "1. Checking MongoDB container..."
SSH_CMD "$SERVER" "cd $REMOTE_DIR && docker compose ps mongodb" || {
    echo "   MongoDB container not found, starting it..."
    SSH_CMD "$SERVER" "cd $REMOTE_DIR && docker compose up -d mongodb"
    sleep 5
}

# Step 2: Wait for MongoDB to be healthy
echo "2. Waiting for MongoDB to be healthy..."
for i in {1..30}; do
    if SSH_CMD "$SERVER" "cd $REMOTE_DIR && docker compose exec -T mongodb mongosh --eval 'db.runCommand({ping: 1})' --quiet" > /dev/null 2>&1; then
        echo "   ✅ MongoDB is healthy"
        break
    fi
    echo "   Waiting... ($i/30)"
    sleep 2
done

# Step 3: Restart backend to reconnect
echo "3. Restarting backend to reconnect to MongoDB..."
SSH_CMD "$SERVER" "cd $REMOTE_DIR && docker compose restart backend"
sleep 10

# Step 4: Verify connection
echo "4. Verifying MongoDB connection..."
SSH_CMD "$SERVER" "cd $REMOTE_DIR && docker compose exec -T backend node -e \"
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava')
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ MongoDB connection failed:', e.message);
    process.exit(1);
  });
\"" 2>&1 | grep -v "level=warning"

echo ""
echo "✅ MongoDB connection fix complete!"
