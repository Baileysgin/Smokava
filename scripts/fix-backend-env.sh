#!/bin/bash
# Fix backend container environment variables

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"

KAVENEGAR_API_KEY="4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D"
KAVENEGAR_TEMPLATE="otp-v2"

echo "🔧 Fixing backend container environment..."

remote_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
    else
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
    fi
}

# Get the image name first
IMAGE_NAME=$(remote_exec "docker inspect smokava-backend --format='{{.Config.Image}}' 2>/dev/null || echo 'smokava-backend'")

echo "Using image: $IMAGE_NAME"

# Stop and remove old container
remote_exec "docker stop smokava-backend 2>/dev/null; docker rm smokava-backend 2>/dev/null; echo 'Old container removed'"

# Get network name
NETWORK=$(remote_exec "docker inspect smokava-backend --format='{{range \$net, \$v := .NetworkSettings.Networks}}{{\$net}}{{end}}' 2>/dev/null || docker network ls | grep smokava | awk '{print \$1}' | head -1 || echo 'smokava_smokava-network'")

echo "Using network: $NETWORK"

# Create new container with correct environment
remote_exec "cd /opt/smokava && docker run -d \
  --name smokava-backend \
  --network $NETWORK \
  --restart unless-stopped \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e MONGODB_URI=mongodb://mongodb:27017/smokava \
  -e JWT_SECRET=your-super-secret-jwt-key-change-in-production \
  -e KAVENEGAR_API_KEY=$KAVENEGAR_API_KEY \
  -e KAVENEGAR_TEMPLATE=$KAVENEGAR_TEMPLATE \
  -e KAVENEGAR_SENDER= \
  -e FRONTEND_URL=https://smokava.com \
  -e ADMIN_PANEL_URL=https://admin.smokava.com \
  -e ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com \
  -v /opt/smokava/backend:/app \
  -v /app/node_modules \
  $IMAGE_NAME node server.js"

echo "⏳ Waiting for container to start..."
sleep 5

# Verify environment
echo "🔍 Verifying environment variables..."
remote_exec "docker exec smokava-backend printenv | grep KAVENEGAR"

echo ""
echo "🧪 Testing OTP endpoint..."
sleep 3

RESPONSE=$(curl -s -X POST https://api.smokava.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"09302593819"}')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "OTP sent successfully" && ! echo "$RESPONSE" | grep -q "SMS failed"; then
    echo "✅✅✅ SUCCESS! OTP system is working! ✅✅✅"
else
    echo "⚠️  Still having issues. Check logs:"
    remote_exec "docker logs --tail=20 smokava-backend | grep -E '(Kavenegar|OTP|SMS)' | tail -10"
fi

