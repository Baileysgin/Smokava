#!/bin/bash

# ===========================================
# CHECK SMS STATUS AND DEBUG
# ===========================================

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"

echo "🔍 Checking SMS Status"
echo "======================"
echo ""

# Function to execute remote commands
remote_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" 2>&1
    else
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" 2>&1
    fi
}

echo "1. Testing OTP endpoint..."
OTP_RESPONSE=$(curl -s -X POST https://api.smokava.com/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"09302593819"}' 2>&1)

echo "Response:"
echo "$OTP_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$OTP_RESPONSE"
echo ""

echo "2. Checking backend logs for Kavenegar activity..."
echo ""
RECENT_LOGS=$(remote_exec "docker logs smokava-backend --tail 50 2>&1 | grep -E '(Kavenegar|lookup|SMS|OTP|error|Error)' | tail -20" || echo "No logs")
if [ -n "$RECENT_LOGS" ] && [ "$RECENT_LOGS" != "No logs" ]; then
    echo "$RECENT_LOGS"
else
    echo "⚠️  No recent logs found"
fi

echo ""
echo "3. Checking environment variables..."
ENV_CHECK=$(remote_exec "docker exec smokava-backend env | grep -E 'KAVENEGAR|NODE_ENV' | sort" || echo "ERROR")
if [ "$ENV_CHECK" != "ERROR" ]; then
    echo "$ENV_CHECK"
else
    echo "⚠️  Could not check environment variables"
fi

echo ""
echo "4. Getting OTP from database (for testing)..."
GET_OTP=$(curl -s "https://api.smokava.com/api/auth/get-otp?phoneNumber=09302593819&secretKey=smokava-otp-debug-2024" 2>&1)
echo "$GET_OTP" | python3 -m json.tool 2>/dev/null || echo "$GET_OTP"

echo ""
echo "✅ Check complete!"

