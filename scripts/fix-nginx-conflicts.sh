#!/bin/bash

# ===========================================
# FIX NGINX CONFLICTING SERVER NAMES
# ===========================================

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"

echo "🔧 Fixing Nginx Conflicting Server Names"
echo "========================================"
echo ""

# Function to execute remote commands
remote_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
    else
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
    fi
}

echo "🔍 Step 1: Finding all Nginx configs with api.smokava.com..."
echo ""
echo "Checking /etc/nginx/sites-available/:"
remote_exec "grep -r 'server_name.*api.smokava.com' /etc/nginx/sites-available/ 2>/dev/null | cut -d: -f1 | sort -u" || echo "No matches in sites-available"

echo ""
echo "Checking /etc/nginx/sites-enabled/:"
remote_exec "grep -r 'server_name.*api.smokava.com' /etc/nginx/sites-enabled/ 2>/dev/null | cut -d: -f1 | sort -u" || echo "No matches in sites-enabled"

echo ""
echo "Checking /etc/nginx/nginx.conf:"
remote_exec "grep -n 'server_name.*api.smokava.com' /etc/nginx/nginx.conf 2>/dev/null || echo 'No matches in nginx.conf'"

echo ""
echo "Checking /etc/nginx/conf.d/:"
remote_exec "grep -r 'server_name.*api.smokava.com' /etc/nginx/conf.d/ 2>/dev/null | cut -d: -f1 | sort -u" || echo "No matches in conf.d"

echo ""
echo "📝 Step 2: Checking if smokava-docker.conf contains api.smokava.com..."
if remote_exec "grep -q 'server_name.*api.smokava.com' /etc/nginx/sites-available/smokava-docker.conf 2>/dev/null || grep -q 'server_name.*api.smokava.com' /etc/nginx/conf.d/smokava-docker.conf 2>/dev/null || echo 'not found'"; then
    echo "⚠️  Found api.smokava.com in smokava-docker.conf"
    echo "This might be causing conflicts. Checking if it's enabled..."

    if remote_exec "test -L /etc/nginx/sites-enabled/smokava-docker.conf || test -f /etc/nginx/conf.d/smokava-docker.conf"; then
        echo "⚠️  smokava-docker.conf is enabled and contains api.smokava.com"
        echo "We should comment out or remove the api.smokava.com section from smokava-docker.conf"
        echo "since we have a dedicated config file for it."

        # Comment out api.smokava.com section in smokava-docker.conf
        echo ""
        echo "📝 Step 3: Commenting out api.smokava.com section in smokava-docker.conf..."
        remote_exec "
        # Find and comment out api.smokava.com server blocks
        if [ -f /etc/nginx/sites-available/smokava-docker.conf ]; then
            sudo sed -i '/# ===========================================/,/# API Backend (api.smokava.com)/{ /server_name.*api.smokava.com/,/^}/ s/^/# / }' /etc/nginx/sites-available/smokava-docker.conf 2>/dev/null || true
        fi
        if [ -f /etc/nginx/conf.d/smokava-docker.conf ]; then
            sudo sed -i '/# ===========================================/,/# API Backend (api.smokava.com)/{ /server_name.*api.smokava.com/,/^}/ s/^/# / }' /etc/nginx/conf.d/smokava-docker.conf 2>/dev/null || true
        fi
        " && echo "✅ Commented out api.smokava.com section"
    fi
else
    echo "✅ No conflicts found in smokava-docker.conf"
fi

echo ""
echo "✅ Step 4: Testing and reloading Nginx..."
remote_exec "sudo nginx -t && sudo systemctl reload nginx" && echo "✅ Nginx reloaded successfully"

echo ""
echo "🧪 Step 5: Verifying no more conflicts..."
CONFLICTS=$(remote_exec "sudo nginx -t 2>&1 | grep -c 'conflicting server name' || echo '0'")
if [ "$CONFLICTS" == "0" ]; then
    echo "✅ No conflicting server name warnings!"
else
    echo "⚠️  Still have $CONFLICTS conflict warning(s)"
    remote_exec "sudo nginx -t 2>&1 | grep 'conflicting server name'"
fi

echo ""
echo "✅ Fix complete!"
echo ""
echo "📋 Test the API:"
echo "   curl https://api.smokava.com/"
echo "   curl -X POST https://api.smokava.com/api/auth/send-otp -H 'Content-Type: application/json' -d '{\"phoneNumber\":\"09302593819\"}'"
