#!/bin/bash

# Final OTP Fix Deployment - Updates environment and restarts services
set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/smokava}"

KAVENEGAR_API_KEY="4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D"
KAVENEGAR_TEMPLATE="otp-v2"

echo "🚀 Final OTP Fix Deployment"
echo "============================"

# Function to execute remote commands with retry
remote_exec() {
    local max_attempts=3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if command -v sshpass &> /dev/null; then
            sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" && return 0
        else
            ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" && return 0
        fi
        echo "⚠️  Attempt $attempt failed, retrying..."
        sleep 2
        attempt=$((attempt + 1))
    done
    return 1
}

# Function to copy files with retry
remote_copy() {
    local max_attempts=3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if command -v sshpass &> /dev/null; then
            sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 -P "$SERVER_PORT" "$1" "$SERVER_USER@$SERVER_IP:$2" && return 0
        else
            scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 -P "$SERVER_PORT" "$1" "$SERVER_USER@$SERVER_IP:$2" && return 0
        fi
        echo "⚠️  Attempt $attempt failed, retrying..."
        sleep 2
        attempt=$((attempt + 1))
    done
    return 1
}

echo ""
echo "📝 Step 1: Updating backend .env file..."
remote_exec "cat > $DEPLOY_DIR/backend/.env << 'ENVEOF'
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/smokava
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
KAVENEGAR_API_KEY=$KAVENEGAR_API_KEY
KAVENEGAR_TEMPLATE=$KAVENEGAR_TEMPLATE
KAVENEGAR_SENDER=
OTP_DEBUG_SECRET_KEY=smokava-otp-debug-2024
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com
ENVEOF
" && echo "✅ .env file updated"

echo ""
echo "📤 Step 2: Copying updated code files..."
remote_copy "backend/routes/auth.js" "$DEPLOY_DIR/backend/routes/auth.js" && echo "✅ auth.js updated"
remote_copy "backend/services/kavenegar.js" "$DEPLOY_DIR/backend/services/kavenegar.js" && echo "✅ kavenegar.js updated"
remote_copy "docker-compose.yml" "$DEPLOY_DIR/docker-compose.yml" && echo "✅ docker-compose.yml updated"

echo ""
echo "🔄 Step 3: Restarting backend with new environment..."
remote_exec "cd $DEPLOY_DIR && \
    export KAVENEGAR_API_KEY=$KAVENEGAR_API_KEY && \
    export KAVENEGAR_TEMPLATE=$KAVENEGAR_TEMPLATE && \
    docker restart smokava-backend" && echo "✅ Backend restarted"

echo ""
echo "⏳ Step 4: Waiting for backend to be ready..."
sleep 8

echo ""
echo "🧪 Step 5: Testing OTP endpoint..."
RESPONSE=$(curl -s -X POST https://api.smokava.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"09302593819"}')

if echo "$RESPONSE" | grep -q "OTP sent successfully"; then
    echo "✅ send-otp endpoint working!"
    echo "Response: $RESPONSE"
else
    echo "⚠️  Response: $RESPONSE"
fi

echo ""
echo "📊 Step 6: Checking backend logs..."
remote_exec "docker logs --tail=20 smokava-backend 2>&1 | grep -E '(Kavenegar|OTP|SMS|error)' | tail -10 || echo 'No recent OTP logs'"

echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo ""
echo "📱 Test the OTP flow at: https://smokava.com/auth"
echo "   Phone: 09302593819"
echo ""
echo "🔍 To check logs:"
echo "   ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP 'docker logs -f smokava-backend'"
echo ""

