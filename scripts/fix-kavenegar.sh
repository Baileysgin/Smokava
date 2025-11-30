#!/bin/bash

# ===========================================
# FIX KAVENEGAR ENVIRONMENT VARIABLES
# ===========================================

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"

echo "🔧 Fixing Kavenegar configuration..."

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass not found. Please run this manually on the server."
    echo ""
    echo "Run these commands on the server:"
    echo "  cd /opt/smokava"
    echo "  sed -i 's|KAVENEGAR_API_KEY=\${KAVENEGAR_API_KEY:-.*}|KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D|g' docker-compose.yml"
    echo "  sed -i 's|KAVENEGAR_TEMPLATE=\${KAVENEGAR_TEMPLATE:-.*}|KAVENEGAR_TEMPLATE=otp-v2|g' docker-compose.yml"
    echo "  docker compose up -d --force-recreate backend"
    exit 1
fi

# Upload updated docker-compose.yml
echo "📤 Uploading docker-compose.yml..."
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -P 22 \
    docker-compose.yml \
    $SERVER_USER@$SERVER_IP:/opt/smokava/docker-compose.yml

# Update and restart backend
echo "🔄 Updating backend..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p 22 $SERVER_USER@$SERVER_IP << 'REMOTE_SCRIPT'
set -e

cd /opt/smokava

# Update Kavenegar values in docker-compose.yml
sed -i 's|KAVENEGAR_API_KEY=\${KAVENEGAR_API_KEY:-.*}|KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D|g' docker-compose.yml
sed -i 's|KAVENEGAR_TEMPLATE=\${KAVENEGAR_TEMPLATE:-.*}|KAVENEGAR_TEMPLATE=otp-v2|g' docker-compose.yml

# Verify changes
echo "✅ Updated docker-compose.yml:"
grep KAVENEGAR docker-compose.yml

# Restart backend
echo "🔄 Restarting backend..."
docker compose up -d --force-recreate backend
sleep 5

# Verify environment variables
echo "✅ Kavenegar environment variables:"
docker compose exec backend printenv | grep KAVENEGAR

echo ""
echo "✅ Kavenegar configuration fixed!"
REMOTE_SCRIPT

echo ""
echo "✅ Fix complete! Test OTP sending now."



