#!/bin/bash

# ===========================================
# DEPLOY KAVENEGAR LOOKUP.JSON IMPLEMENTATION
# ===========================================

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/smokava}"

echo "🚀 Deploying Kavenegar lookup.json Implementation"
echo "=================================================="
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
remote_copy "backend/services/kavenegar.js" "$DEPLOY_DIR/backend/services/kavenegar.js" && echo "✅ File copied successfully"

echo ""
echo "🔄 Step 2: Restarting backend container..."
remote_exec "docker restart smokava-backend" && echo "✅ Backend restarted"

echo ""
echo "⏳ Step 3: Waiting for backend to be ready..."
sleep 8

echo ""
echo "🧪 Step 4: Testing OTP endpoint with lookup.json..."
OTP_RESPONSE=$(curl -s -X POST https://api.smokava.com/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"09302593819"}' \
    -w "\nHTTP_CODE:%{http_code}\n" 2>&1)

echo "Response:"
echo "$OTP_RESPONSE" | grep -v "HTTP_CODE" | python3 -m json.tool 2>/dev/null || echo "$OTP_RESPONSE" | grep -v "HTTP_CODE"
HTTP_CODE=$(echo "$OTP_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
echo ""
echo "HTTP Status: $HTTP_CODE"

echo ""
echo "📊 Step 5: Checking backend logs for Kavenegar lookup.json activity..."
SMS_LOGS=$(remote_exec "docker logs smokava-backend --tail 40 2>&1 | grep -E '(Kavenegar|lookup|SMS|OTP)' | tail -15" || echo "No logs")
if [ -n "$SMS_LOGS" ] && [ "$SMS_LOGS" != "No logs" ]; then
    echo "Recent Kavenegar logs:"
    echo "$SMS_LOGS"
else
    echo "⚠️  No recent Kavenegar logs found"
fi

echo ""
if [ "$HTTP_CODE" == "200" ]; then
    if echo "$OTP_RESPONSE" | grep -q "OTP sent successfully"; then
        echo "✅ SUCCESS: OTP sent successfully via Kavenegar lookup.json!"
    else
        echo "⚠️  OTP endpoint responded but check SMS delivery status"
    fi
else
    echo "⚠️  OTP endpoint returned HTTP $HTTP_CODE"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📱 Test the OTP flow at: https://smokava.com/auth"
echo "   Phone: 09302593819"
echo ""
echo "📋 Implementation details:"
echo "   - Using Kavenegar verify/lookup.json endpoint"
echo "   - API Key: From KAVENEGAR_API_KEY env variable"
echo "   - Template: From KAVENEGAR_TEMPLATE env variable"
echo "   - Token: OTP code (6-digit for login)"
echo ""
echo "📚 Documentation:"
echo "   - REST API: https://kavenegar.com/rest.html"
echo "   - Node.js SDK: https://kavenegar.com/SDK.html#node"
