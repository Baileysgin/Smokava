#!/bin/bash

# Simplified OTP Fix Deployment Script
set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/smokava}"

KAVENEGAR_API_KEY="4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D"
KAVENEGAR_TEMPLATE="otp-v2"

echo "🚀 Deploying OTP Fix..."

# Remote exec function
remote_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
    else
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
    fi
}

# Step 1: Update backend .env file
echo "📝 Updating backend environment..."
remote_exec "cat > $DEPLOY_DIR/backend/.env << 'EOF'
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
EOF"

# Step 2: Copy updated files
echo "📤 Copying updated files..."
TEMP_DIR=$(mktemp -d)

# Copy backend routes/auth.js
cp backend/routes/auth.js "$TEMP_DIR/auth.js"
cp backend/services/kavenegar.js "$TEMP_DIR/kavenegar.js"

if command -v sshpass &> /dev/null; then
    sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -P "$SERVER_PORT" "$TEMP_DIR/auth.js" "$SERVER_USER@$SERVER_IP:$DEPLOY_DIR/backend/routes/auth.js"
    sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -P "$SERVER_PORT" "$TEMP_DIR/kavenegar.js" "$SERVER_USER@$SERVER_IP:$DEPLOY_DIR/backend/services/kavenegar.js"
else
    scp -o StrictHostKeyChecking=no -P "$SERVER_PORT" "$TEMP_DIR/auth.js" "$SERVER_USER@$SERVER_IP:$DEPLOY_DIR/backend/routes/auth.js"
    scp -o StrictHostKeyChecking=no -P "$SERVER_PORT" "$TEMP_DIR/kavenegar.js" "$SERVER_USER@$SERVER_IP:$DEPLOY_DIR/backend/services/kavenegar.js"
fi

rm -rf "$TEMP_DIR"

# Step 3: Restart backend
echo "🔄 Restarting backend..."
remote_exec "cd $DEPLOY_DIR && \
    export KAVENEGAR_API_KEY=$KAVENEGAR_API_KEY && \
    export KAVENEGAR_TEMPLATE=$KAVENEGAR_TEMPLATE && \
    docker-compose restart backend"

echo "⏳ Waiting for backend to restart..."
sleep 5

# Step 4: Test endpoint
echo "🧪 Testing send-otp endpoint..."
sleep 3

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
echo "✅ Deployment complete!"
echo "📱 Test at: https://smokava.com/auth"

