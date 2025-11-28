#!/bin/bash

# ===========================================
# FINAL BACKEND STATUS CHECK
# ===========================================

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"

echo "🔍 Final Backend Status Check"
echo "============================"
echo ""

# Function to execute remote commands
remote_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" 2>/dev/null || echo "ERROR"
    else
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" 2>/dev/null || echo "ERROR"
    fi
}

# Check backend container
echo "1. Backend Container Status:"
CONTAINER_STATUS=$(remote_exec "docker inspect -f '{{.State.Status}}' smokava-backend 2>/dev/null" || echo "ERROR")
if [ "$CONTAINER_STATUS" == "running" ]; then
    echo "   ✅ Running"
else
    echo "   ❌ $CONTAINER_STATUS"
fi

# Check backend port
echo ""
echo "2. Backend Port Listening:"
PORT_CHECK=$(remote_exec "docker exec smokava-backend sh -c 'netstat -tuln 2>/dev/null | grep :5000 || ss -tuln 2>/dev/null | grep :5000 || echo not_listening'" || echo "ERROR")
if echo "$PORT_CHECK" | grep -q ":5000"; then
    echo "   ✅ Port 5000 is listening"
else
    echo "   ❌ Port 5000 not listening"
fi

# Check environment variables
echo ""
echo "3. Environment Variables:"
ENV_CHECK=$(remote_exec "docker exec smokava-backend env | grep -E 'KAVENEGAR_API_KEY|KAVENEGAR_TEMPLATE|NODE_ENV|API_BASE_URL' | sort" || echo "ERROR")
if [ "$ENV_CHECK" != "ERROR" ] && [ -n "$ENV_CHECK" ]; then
    echo "   ✅ Environment variables set:"
    echo "$ENV_CHECK" | sed 's/^/      /'
else
    echo "   ⚠️  Could not verify environment variables"
fi

# Check Nginx
echo ""
echo "4. Nginx Status:"
NGINX_STATUS=$(remote_exec "systemctl is-active nginx 2>/dev/null" || echo "ERROR")
if [ "$NGINX_STATUS" == "active" ]; then
    echo "   ✅ Active"
else
    echo "   ❌ $NGINX_STATUS"
fi

# Check SSL
echo ""
echo "5. SSL Certificate:"
SSL_CHECK=$(remote_exec "test -f /etc/letsencrypt/live/api.smokava.com/fullchain.pem && echo 'exists' || echo 'missing'" || echo "ERROR")
if [ "$SSL_CHECK" == "exists" ]; then
    echo "   ✅ Certificate exists"
    CERT_EXPIRY=$(remote_exec "sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/api.smokava.com/fullchain.pem 2>/dev/null | cut -d= -f2" || echo "unknown")
    echo "   Expires: $CERT_EXPIRY"
else
    echo "   ❌ Certificate missing"
fi

# Check recent backend logs
echo ""
echo "6. Recent Backend Logs (last 10 lines):"
RECENT_LOGS=$(remote_exec "docker logs smokava-backend --tail 10 2>&1" || echo "ERROR")
if [ "$RECENT_LOGS" != "ERROR" ]; then
    echo "$RECENT_LOGS" | sed 's/^/   /'
else
    echo "   ⚠️  Could not retrieve logs"
fi

# Check Kavenegar activity
echo ""
echo "7. Kavenegar Activity (last 5 occurrences):"
KAVENEGAR_LOGS=$(remote_exec "docker logs smokava-backend 2>&1 | grep -E '(Kavenegar|SMS sent)' | tail -5" || echo "ERROR")
if [ "$KAVENEGAR_LOGS" != "ERROR" ] && [ -n "$KAVENEGAR_LOGS" ]; then
    echo "$KAVENEGAR_LOGS" | sed 's/^/   /'
else
    echo "   ⚠️  No recent Kavenegar activity found"
fi

echo ""
echo "✅ Status check complete!"
