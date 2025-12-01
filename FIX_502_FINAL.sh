#!/bin/bash
# FINAL 502 FIX - Run this on your server
# sudo bash FIX_502_FINAL.sh

set -e

echo "🚀 Starting 502 Bad Gateway Fix..."
echo ""

cd /opt/smokava || {
    echo "❌ Error: /opt/smokava not found"
    exit 1
}

echo "📥 Pulling latest code..."
git pull origin main || git pull origin master || echo "⚠️  Could not pull code"

echo ""
echo "🛑 Stopping admin-panel..."
docker compose stop admin-panel 2>/dev/null || docker-compose stop admin-panel 2>/dev/null || true
docker rm -f smokava-admin-panel 2>/dev/null || true

echo ""
echo "🔨 Rebuilding admin-panel (this takes 3-5 minutes)..."
docker compose build --no-cache admin-panel 2>/dev/null || docker-compose build --no-cache admin-panel || {
    echo "⚠️  Build with --no-cache failed, trying regular build..."
    docker compose build admin-panel 2>/dev/null || docker-compose build admin-panel
}

echo ""
echo "🚀 Starting admin-panel..."
docker compose up -d admin-panel 2>/dev/null || docker-compose up -d admin-panel

echo ""
echo "⏳ Waiting for container to start (30 seconds)..."
sleep 30

echo ""
echo "🔍 Testing connection..."
for i in {1..10}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:5173 2>/dev/null || echo "000")
    if echo "$HTTP_CODE" | grep -qE "200|301|302|404"; then
        echo "✅ SUCCESS! Admin panel is responding (HTTP $HTTP_CODE)"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Still not responding. Checking logs..."
        docker compose logs --tail=30 admin-panel 2>/dev/null || docker-compose logs --tail=30 admin-panel
        exit 1
    fi
    echo "   Attempt $i/10: HTTP $HTTP_CODE (waiting...)"
    sleep 3
done

echo ""
echo "🔄 Reloading nginx..."
if command -v nginx >/dev/null 2>&1; then
    nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true
fi

echo ""
echo "✅ Fix complete!"
echo ""
echo "🌐 Try accessing: https://admin.smokava.com"
echo "   (Wait 30 seconds, then clear browser cache)"

