#!/bin/bash

# ===========================================
# DEBUG SMS DELIVERY - CHECK KAVENEGAR
# ===========================================

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"

echo "🔍 Debugging SMS Delivery"
echo "========================="
echo ""

# Function to execute remote commands
remote_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" 2>&1
    else
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" 2>&1
    fi
}

echo "1. Checking backend container environment variables..."
echo ""
ENV_VARS=$(remote_exec "docker exec smokava-backend env | grep -E 'KAVENEGAR|NODE_ENV' | sort")
echo "$ENV_VARS"
echo ""

echo "2. Checking recent backend logs for OTP/SMS activity..."
echo ""
RECENT_LOGS=$(remote_exec "docker logs smokava-backend --tail 50 2>&1 | grep -E '(send-otp|Kavenegar|SMS|OTP|kavenegar)' | tail -20")
if [ -n "$RECENT_LOGS" ]; then
    echo "$RECENT_LOGS"
else
    echo "⚠️  No recent OTP/SMS logs found"
fi
echo ""

echo "3. Testing OTP endpoint and checking full response..."
echo ""
OTP_RESPONSE=$(curl -s -X POST https://api.smokava.com/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"09302593819"}' \
    -w "\nHTTP_CODE:%{http_code}\n" 2>&1)
echo "$OTP_RESPONSE"
echo ""

echo "4. Checking backend logs immediately after OTP request..."
echo ""
sleep 2
LATEST_LOGS=$(remote_exec "docker logs smokava-backend --tail 30 2>&1 | tail -20")
echo "$LATEST_LOGS"
echo ""

echo "5. Checking if Kavenegar service file exists and is correct..."
echo ""
KAVENEGAR_FILE=$(remote_exec "docker exec smokava-backend sh -c 'test -f /app/services/kavenegar.js && cat /app/services/kavenegar.js | head -50' || echo 'File not found'")
if [ -n "$KAVENEGAR_FILE" ] && [ "$KAVENEGAR_FILE" != "File not found" ]; then
    echo "Kavenegar service file (first 50 lines):"
    echo "$KAVENEGAR_FILE"
else
    echo "⚠️  Kavenegar service file not found or not readable"
fi
echo ""

echo "6. Testing Kavenegar API directly with the API key..."
echo ""
KAVENEGAR_API_KEY=$(remote_exec "docker exec smokava-backend sh -c 'echo \$KAVENEGAR_API_KEY'")
KAVENEGAR_TEMPLATE=$(remote_exec "docker exec smokava-backend sh -c 'echo \$KAVENEGAR_TEMPLATE'")

if [ -n "$KAVENEGAR_API_KEY" ] && [ "$KAVENEGAR_API_KEY" != "ERROR" ]; then
    echo "API Key: ${KAVENEGAR_API_KEY:0:20}... (truncated)"
    echo "Template: $KAVENEGAR_TEMPLATE"
    echo ""
    echo "Testing Kavenegar API directly..."
    TEST_OTP="123456"
    KAVENEGAR_URL="https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json"
    KAVENEGAR_TEST=$(curl -s -X GET "$KAVENEGAR_URL?receptor=09302593819&token=$TEST_OTP&template=$KAVENEGAR_TEMPLATE" 2>&1)
    echo "Kavenegar API Response:"
    echo "$KAVENEGAR_TEST" | head -20
else
    echo "❌ KAVENEGAR_API_KEY not found in container"
fi
echo ""

echo "7. Checking backend routes/auth.js for OTP logic..."
echo ""
AUTH_ROUTE=$(remote_exec "docker exec smokava-backend sh -c 'test -f /app/routes/auth.js && grep -A 20 \"send-otp\" /app/routes/auth.js | head -30' || echo 'File not found'")
if [ -n "$AUTH_ROUTE" ] && [ "$AUTH_ROUTE" != "File not found" ]; then
    echo "send-otp route (first 30 lines):"
    echo "$AUTH_ROUTE"
else
    echo "⚠️  auth.js route not found or not readable"
fi

echo ""
echo "✅ Debug complete!"



