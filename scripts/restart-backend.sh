#!/bin/bash

# Script to restart backend and wait for it to be ready

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

echo "🔄 Restarting Backend..."
echo ""

# Step 1: Pull latest code
echo "1. Pulling latest code..."
SSH_CMD "$SERVER" "cd $REMOTE_DIR && git pull origin main" 2>&1 | grep -v "level=warning" || {
    echo "   ⚠️  Git pull had issues, continuing..."
}

# Step 2: Rebuild backend
echo "2. Rebuilding backend..."
DOCKER_COMPOSE_CMD="docker compose"
if ! SSH_CMD "$SERVER" "cd $REMOTE_DIR && command -v docker compose >/dev/null 2>&1"; then
    DOCKER_COMPOSE_CMD="docker-compose"
fi

SSH_CMD "$SERVER" "cd $REMOTE_DIR && \
    $DOCKER_COMPOSE_CMD build backend && \
    $DOCKER_COMPOSE_CMD up -d --no-deps backend" 2>&1 | grep -v "level=warning"

# Step 3: Wait for backend to be ready
echo "3. Waiting for backend to be ready..."
sleep 15

# Step 4: Check backend logs
echo "4. Checking backend status..."
SSH_CMD "$SERVER" "cd $REMOTE_DIR && \
    $DOCKER_COMPOSE_CMD logs backend --tail=20" 2>&1 | grep -E "(MongoDB|Server running|error|Error)" || true

# Step 5: Test health endpoint
echo "5. Testing health endpoint..."
sleep 5
HEALTH=$(curl -s "https://api.smokava.com/api/health" 2>&1)
if echo "$HEALTH" | grep -q "connected"; then
    echo "   ✅ Database connected"
else
    echo "   ⚠️  Database still disconnected"
    echo "   Response: $HEALTH"
fi

echo ""
echo "✅ Backend restart complete!"
