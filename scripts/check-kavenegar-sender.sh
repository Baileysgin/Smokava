#!/bin/bash

# ===========================================
# CHECK KAVENEGAR SENDER NUMBERS
# ===========================================

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"

echo "🔍 Checking Kavenegar Sender Numbers"
echo "====================================="
echo ""

# Function to execute remote commands
remote_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" 2>&1
    else
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" 2>&1
    fi
}

echo "1. Getting API Key from backend..."
API_KEY=$(remote_exec "docker exec smokava-backend sh -c 'echo \$KAVENEGAR_API_KEY'" || echo "")

if [ -z "$API_KEY" ] || [ "$API_KEY" == "ERROR" ]; then
    echo "❌ Could not get API key"
    exit 1
fi

echo "API Key: ${API_KEY:0:20}... (truncated)"
echo ""

echo "2. Trying to get account info from Kavenegar..."
echo "   (This will show available sender numbers if API supports it)"
echo ""

# Try to get account info - Kavenegar might have an endpoint for this
ACCOUNT_INFO=$(curl -s "https://api.kavenegar.com/v1/${API_KEY}/account/info.json" 2>&1 || echo "failed")

if [ "$ACCOUNT_INFO" != "failed" ]; then
    echo "Account Info Response:"
    echo "$ACCOUNT_INFO" | python3 -m json.tool 2>/dev/null || echo "$ACCOUNT_INFO"
else
    echo "⚠️  Could not get account info"
fi

echo ""
echo "3. Checking Kavenegar documentation for sender requirements..."
echo ""
echo "📋 Next Steps:"
echo "   1. Check your Kavenegar panel: https://panel.kavenegar.com"
echo "   2. Go to 'شماره‌های من' (My Numbers) section"
echo "   3. Find your registered sender number"
echo "   4. Set it as KAVENEGAR_SENDER environment variable"
echo ""
echo "   OR"
echo ""
echo "   5. If you don't have a registered sender, you may need to:"
echo "      - Register a sender number in Kavenegar panel"
echo "      - Or upgrade to premium plan to use lookup.json"
echo ""



