#!/bin/bash

# ===========================================
# DEPLOY SMS FIX - KAVENEGAR FALLBACK
# ===========================================

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/smokava}"

echo "🚀 Deploying SMS Fix"
echo "==================="
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

echo "📤 Step 1: Copying updated kavenegar.js to server..."
remote_copy "backend/services/kavenegar.js" "$DEPLOY_DIR/backend/services/kavenegar.js" && echo "✅ File copied"

echo ""
echo "🔄 Step 2: Restarting backend container..."
remote_exec "docker restart smokava-backend" && echo "✅ Backend restarted"

echo ""
echo "⏳ Step 3: Waiting for backend to be ready..."
sleep 8

echo ""
echo "🧪 Step 4: Testing OTP endpoint..."
OTP_RESPONSE=$(curl -s -X POST https://api.smokava.com/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"09302593819"}' \
    -w "\nHTTP_CODE:%{http_code}\n" 2>&1)

echo "Response:"
echo "$OTP_RESPONSE" | grep -v "HTTP_CODE" | head -10
HTTP_CODE=$(echo "$OTP_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
echo "HTTP Status: $HTTP_CODE"

echo ""
echo "📊 Step 5: Checking backend logs for SMS activity..."
SMS_LOGS=$(remote_exec "docker logs smokava-backend --tail 30 2>&1 | grep -E '(Kavenegar|SMS|fallback|basic send)' | tail -10" || echo "No logs")
if [ -n "$SMS_LOGS" ] && [ "$SMS_LOGS" != "No logs" ]; then
    echo "Recent SMS logs:"
    echo "$SMS_LOGS"
else
    echo "⚠️  No recent SMS logs found"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📱 Test the OTP flow at: https://smokava.com/auth"
echo "   Phone: 09302593819"
echo ""
echo "The system will now:"
echo "  1. Try verify/lookup endpoint first (if template is set)"
echo "  2. Automatically fallback to basic SMS send if premium is required"
echo "  3. Send SMS with message: 'کد تایید اسموکاوا: [CODE]'"



