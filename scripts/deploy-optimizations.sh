#!/bin/bash

# ===========================================
# DEPLOY PERFORMANCE OPTIMIZATIONS
# ===========================================

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"

echo "🚀 Deploying performance optimizations..."

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass not found. Please install it or run commands manually."
    exit 1
fi

# 1. Upload optimized Nginx config
echo "📤 Uploading optimized Nginx config..."
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -P 22 \
    nginx/smokava-docker.conf \
    $SERVER_USER@$SERVER_IP:/tmp/smokava-nginx-optimized.conf

# 2. Update Nginx on server
echo "⚙️  Updating Nginx configuration..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p 22 $SERVER_USER@$SERVER_IP << 'REMOTE_SCRIPT'
set -e

# Copy config
sudo cp /tmp/smokava-nginx-optimized.conf /etc/nginx/sites-available/smokava

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx updated and reloaded"
REMOTE_SCRIPT

# 3. Install backend compression
echo "📦 Installing backend compression..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p 22 $SERVER_USER@$SERVER_IP << 'REMOTE_SCRIPT'
cd /opt/smokava
docker compose exec -T backend npm install compression
echo "✅ Compression installed in backend"
REMOTE_SCRIPT

# 4. Restart backend
echo "🔄 Restarting backend..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p 22 $SERVER_USER@$SERVER_IP << 'REMOTE_SCRIPT'
cd /opt/smokava
docker compose restart backend
sleep 3
echo "✅ Backend restarted"
REMOTE_SCRIPT

echo ""
echo "✅ All optimizations deployed!"
echo ""
echo "🧪 Test the optimizations:"
echo "   curl -H 'Accept-Encoding: gzip' -I http://admin.smokava.com"
echo "   curl -H 'Accept-Encoding: gzip' -I http://api.smokava.com"

