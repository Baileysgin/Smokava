#!/bin/bash

# Comprehensive fix and test script for server

set -e

SERVER="${SSH_HOST:-root@91.107.241.245}"
REMOTE_DIR="/opt/smokava"
API_URL="${API_BASE_URL:-https://api.smokava.com}"

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

echo "🔧 Fixing and Testing Server..."
echo ""

# Step 1: Fix MongoDB
echo "1. Fixing MongoDB connection..."
SSH_CMD "$SERVER" "cd $REMOTE_DIR && \
    docker compose restart mongodb && \
    sleep 10 && \
    docker compose exec -T mongodb mongosh --eval 'db.runCommand({ping: 1})' --quiet" || {
    echo "   ⚠️  MongoDB health check failed, but continuing..."
}

# Step 2: Restart backend
echo "2. Restarting backend..."
SSH_CMD "$SERVER" "cd $REMOTE_DIR && \
    docker compose restart backend && \
    sleep 10"

# Step 3: Ensure admin user
echo "3. Ensuring admin user exists..."
SSH_CMD "$SERVER" "cd $REMOTE_DIR && \
    docker compose exec -T backend node scripts/createAdmin.js admin admin123" 2>&1 | grep -v "level=warning" || {
    echo "   ⚠️  Admin creation had issues"
}

# Step 4: Wait for services
echo "4. Waiting for services to stabilize..."
sleep 15

# Step 5: Test endpoints
echo "5. Testing endpoints..."

# Health check
echo "   - Health endpoint..."
HEALTH=$(curl -s "${API_URL}/api/health" 2>&1)
if echo "$HEALTH" | grep -q "healthy"; then
    echo "      ✅ Health check passed"
    if echo "$HEALTH" | grep -q "connected"; then
        echo "      ✅ Database connected"
    else
        echo "      ⚠️  Database still disconnected"
    fi
else
    echo "      ❌ Health check failed"
fi

# Admin login
echo "   - Admin login..."
ADMIN_LOGIN=$(curl -s -X POST "${API_URL}/api/admin/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' 2>&1)

if echo "$ADMIN_LOGIN" | grep -q "token"; then
    echo "      ✅ Admin login works"
    ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null || echo "")
    if [ -n "$ADMIN_TOKEN" ]; then
        echo "      ✅ Token received"

        # Test admin dashboard
        echo "   - Admin dashboard..."
        DASHBOARD=$(curl -s "${API_URL}/api/admin/dashboard/stats" \
            -H "Authorization: Bearer $ADMIN_TOKEN" 2>&1)
        if echo "$DASHBOARD" | grep -q "users\|restaurants"; then
            echo "      ✅ Admin dashboard accessible"
        else
            echo "      ⚠️  Admin dashboard issue"
        fi
    fi
else
    echo "      ❌ Admin login failed"
    echo "      Response: $ADMIN_LOGIN" | head -3
fi

# User OTP send
echo "   - User OTP send..."
OTP_SEND=$(curl -s -X POST "${API_URL}/api/auth/send-otp" \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"09302593819"}' 2>&1)

if echo "$OTP_SEND" | grep -q "success\|OTP"; then
    echo "      ✅ OTP send works"
else
    echo "      ❌ OTP send failed"
    echo "      Response: $OTP_SEND" | head -3
fi

# Public endpoints
echo "   - Public endpoints..."
RESTAURANTS=$(curl -s -w "%{http_code}" "${API_URL}/api/restaurants" -o /dev/null 2>&1)
PACKAGES=$(curl -s -w "%{http_code}" "${API_URL}/api/packages" -o /dev/null 2>&1)

if [ "$RESTAURANTS" = "200" ]; then
    echo "      ✅ Restaurants endpoint works"
else
    echo "      ❌ Restaurants endpoint failed (HTTP $RESTAURANTS)"
fi

if [ "$PACKAGES" = "200" ]; then
    echo "      ✅ Packages endpoint works"
else
    echo "      ❌ Packages endpoint failed (HTTP $PACKAGES)"
fi

echo ""
echo "✅ Testing complete!"
echo ""
echo "📋 Summary:"
echo "   Check results above for any ❌ failures"
echo "   If MongoDB is disconnected, restart services on server"
