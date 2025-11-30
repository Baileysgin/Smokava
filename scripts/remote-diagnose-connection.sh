#!/bin/bash

# ===========================================
# REMOTE DIAGNOSTIC & FIX SCRIPT
# Runs diagnostic on remote server via SSH
# ===========================================

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/smokava}"

echo "🔍 ============================================"
echo "🔍 REMOTE CONNECTION DIAGNOSTIC"
echo "🔍 ============================================"
echo ""
echo "Server: $SERVER_USER@$SERVER_IP:$SERVER_PORT"
echo ""

# Function to execute remote commands
remote_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
    else
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
    fi
}

# Function to copy files
remote_copy() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 -P "$SERVER_PORT" "$1" "$SERVER_USER@$SERVER_IP:$2"
    else
        scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 -P "$SERVER_PORT" "$1" "$SERVER_USER@$SERVER_IP:$2"
    fi
}

echo "📤 Uploading diagnostic script to server..."
remote_copy "scripts/diagnose-and-fix-connection.sh" "/tmp/diagnose-and-fix-connection.sh"

echo ""
echo "🚀 Running diagnostic on server..."
echo ""

# Run the diagnostic script on the server
remote_exec "chmod +x /tmp/diagnose-and-fix-connection.sh && bash /tmp/diagnose-and-fix-connection.sh"

echo ""
echo "✅ Diagnostic complete!"
echo ""
echo "📋 Next steps if issues persist:"
echo "   1. Check backend logs: ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP 'docker logs -f smokava-backend'"
echo "   2. Check Nginx logs: ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP 'sudo tail -f /var/log/nginx/error.log'"
echo "   3. Test API: curl -X POST https://api.smokava.com/api/auth/send-otp -H 'Content-Type: application/json' -d '{\"phoneNumber\":\"09302593819\"}'"



