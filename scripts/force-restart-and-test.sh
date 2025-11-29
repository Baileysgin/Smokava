#!/bin/bash

# ===========================================
# FORCE RESTART AND TEST SMS
# ===========================================

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/smokava}"

echo "🔄 Force Restart and Test SMS"
echo "============================="
echo ""

# Function to execute remote commands
remote_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" 2>&1
    else
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" 2>&1
    fi
}

# Function to copy files
remote_copy() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -o ConnectTimeout=15 -P "$SERVER_PORT" "$1" "$SERVER_USER@$SERVER_IP:$2" 2>&1
    else
        scp -o StrictHostKeyChecking=no -o ConnectTimeout=15 -P "$SERVER_PORT" "$1" "$SERVER_USER@$SERVER_IP:$2" 2>&1
    fi
}

echo "📤 Step 1: Copying updated kavenegar.js..."
remote_copy "backend/services/kavenegar.js" "$DEPLOY_DIR/backend/services/kavenegar.js" && echo "✅ File copied"

echo ""
echo "🔄 Step 2: Restarting backend container..."
remote_exec "docker restart smokava-backend" && echo "✅ Backend restarted"

echo ""
echo "⏳ Step 3: Waiting for backend to be ready..."
sleep 10

echo ""
echo "🧪 Step 4: Testing OTP endpoint..."
OTP_RESPONSE=$(curl -s -X POST https://api.smokava.com/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"09302593819"}' 2>&1)

echo "Response:"
echo "$OTP_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$OTP_RESPONSE"

echo ""
echo "📊 Step 5: Checking backend logs..."
sleep 2
LOGS=$(remote_exec "docker logs smokava-backend --tail 30 2>&1 | grep -E '(fallback|basic SMS|lookup|Kavenegar)' | tail -10" || echo "No logs")
if [ -n "$LOGS" ] && [ "$LOGS" != "No logs" ]; then
    echo "Recent logs:"
    echo "$LOGS"
else
    echo "⚠️  No recent logs found"
    echo "Full recent logs:"
    remote_exec "docker logs smokava-backend --tail 20 2>&1" | tail -10
fi

echo ""
if echo "$OTP_RESPONSE" | grep -q "OTP sent successfully"; then
    echo "✅ SUCCESS: SMS should be sent!"
elif echo "$OTP_RESPONSE" | grep -q "fallback"; then
    echo "⚠️  Fallback was triggered, check logs above"
else
    echo "❌ SMS failed, check error above"
fi


