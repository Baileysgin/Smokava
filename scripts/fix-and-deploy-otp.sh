#!/bin/bash

# Comprehensive OTP System Fix and Deployment Script
set -e

echo "🔧 Starting OTP System Fix and Deployment..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server configuration
SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/smokava}"

# Kavenegar credentials
KAVENEGAR_API_KEY="4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D"
KAVENEGAR_TEMPLATE="otp-v2"

echo ""
echo "📋 Step 1: Verifying local code fixes..."
echo "=========================================="

# Verify backend routes/auth.js has the fix
if grep -q "String(code).trim()" backend/routes/auth.js; then
    echo -e "${GREEN}✅ OTP verification fix found${NC}"
else
    echo -e "${RED}❌ OTP verification fix missing${NC}"
    exit 1
fi

# Verify Kavenegar service
if [ -f "backend/services/kavenegar.js" ]; then
    echo -e "${GREEN}✅ Kavenegar service exists${NC}"
else
    echo -e "${RED}❌ Kavenegar service missing${NC}"
    exit 1
fi

# Verify frontend API client
if grep -q "NEXT_PUBLIC_API_URL" frontend/lib/api.ts; then
    echo -e "${GREEN}✅ Frontend API client uses environment variable${NC}"
else
    echo -e "${RED}❌ Frontend API client issue${NC}"
    exit 1
fi

echo ""
echo "📦 Step 2: Creating deployment package..."
echo "=========================================="

TEMP_DIR=$(mktemp -d)
DEPLOY_PACKAGE="$TEMP_DIR/smokava-deploy.tar.gz"

# Create .tar.gz excluding unnecessary files
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='backend/.env' \
    --exclude='frontend/.env.local' \
    --exclude='admin-panel/.env' \
    -czf "$DEPLOY_PACKAGE" .

echo -e "${GREEN}✅ Deployment package created${NC}"

echo ""
echo "📤 Step 3: Uploading to server..."
echo "=========================================="

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}⚠️  sshpass not found. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command -v brew &> /dev/null; then
            echo -e "${RED}❌ Please install Homebrew first${NC}"
            exit 1
        fi
        brew install hudochenkov/sshpass/sshpass || true
    fi
fi

# Function to execute remote commands
remote_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
    else
        ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
    fi
}

# Function to copy files
remote_copy() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -P "$SERVER_PORT" -r "$1" "$SERVER_USER@$SERVER_IP:$2"
    else
        scp -o StrictHostKeyChecking=no -P "$SERVER_PORT" -r "$1" "$SERVER_USER@$SERVER_IP:$2"
    fi
}

# Create deployment directory on server
remote_exec "mkdir -p $DEPLOY_DIR"

# Upload the package
remote_copy "$DEPLOY_PACKAGE" "$DEPLOY_DIR/"

echo -e "${GREEN}✅ Files uploaded${NC}"

echo ""
echo "🔧 Step 4: Setting up environment on server..."
echo "=========================================="

# Extract and setup on server
remote_exec "cd $DEPLOY_DIR && \
    tar -xzf smokava-deploy.tar.gz && \
    rm smokava-deploy.tar.gz"

# Create .env file for backend on server
remote_exec "cat > $DEPLOY_DIR/backend/.env << 'EOF'
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/smokava
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
KAVENEGAR_API_KEY=$KAVENEGAR_API_KEY
KAVENEGAR_TEMPLATE=$KAVENEGAR_TEMPLATE
KAVENEGAR_SENDER=
OTP_DEBUG_SECRET_KEY=smokava-otp-debug-2024
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com
EOF"

echo -e "${GREEN}✅ Environment variables configured${NC}"

echo ""
echo "🐳 Step 5: Rebuilding and restarting Docker containers..."
echo "=========================================="

# Rebuild and restart services
remote_exec "cd $DEPLOY_DIR && \
    export KAVENEGAR_API_KEY=$KAVENEGAR_API_KEY && \
    export KAVENEGAR_TEMPLATE=$KAVENEGAR_TEMPLATE && \
    export NEXT_PUBLIC_API_URL=https://api.smokava.com/api && \
    export VITE_API_URL=https://api.smokava.com/api && \
    docker-compose down && \
    docker-compose build --no-cache backend frontend admin-panel && \
    docker-compose up -d"

echo -e "${GREEN}✅ Services restarted${NC}"

echo ""
echo "⏳ Step 6: Waiting for services to be ready..."
echo "=========================================="

sleep 10

# Check if services are running
remote_exec "cd $DEPLOY_DIR && docker-compose ps"

echo ""
echo "🧪 Step 7: Testing OTP endpoints..."
echo "=========================================="

# Test send-otp endpoint
echo "Testing send-otp endpoint..."
RESPONSE=$(curl -s -X POST https://api.smokava.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"09302593819"}')

if echo "$RESPONSE" | grep -q "OTP sent successfully"; then
    echo -e "${GREEN}✅ send-otp endpoint working${NC}"
else
    echo -e "${RED}❌ send-otp endpoint failed${NC}"
    echo "Response: $RESPONSE"
fi

echo ""
echo "📋 Step 8: Checking backend logs..."
echo "=========================================="

remote_exec "cd $DEPLOY_DIR && docker-compose logs --tail=50 backend | grep -E '(OTP|Kavenegar|SMS)' || echo 'No recent OTP logs'"

echo ""
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "🌐 Services:"
echo "   - Frontend: https://smokava.com"
echo "   - Backend API: https://api.smokava.com"
echo "   - Admin Panel: https://admin.smokava.com"
echo ""
echo "📱 Test OTP flow:"
echo "   1. Go to: https://smokava.com/auth"
echo "   2. Enter phone: 09302593819"
echo "   3. Request OTP"
echo "   4. Check phone for SMS"
echo "   5. Enter code to login"
echo ""
echo "📊 View logs:"
echo "   ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP 'cd $DEPLOY_DIR && docker-compose logs -f backend'"
echo ""

# Cleanup
rm -rf "$TEMP_DIR"



