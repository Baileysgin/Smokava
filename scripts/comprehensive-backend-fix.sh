#!/bin/bash

# ===========================================
# COMPREHENSIVE BACKEND/API FIX
# Automatically diagnoses and fixes all issues
# ===========================================

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/smokava}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 ============================================${NC}"
echo -e "${BLUE}🔧 COMPREHENSIVE BACKEND/API FIX${NC}"
echo -e "${BLUE}🔧 ============================================${NC}"
echo ""

# Function to execute remote commands
remote_exec() {
    local max_attempts=3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if command -v sshpass &> /dev/null; then
            sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" && return 0
        else
            ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@" && return 0
        fi
        echo -e "${YELLOW}⚠️  Attempt $attempt failed, retrying...${NC}"
        sleep 3
        attempt=$((attempt + 1))
    done
    return 1
}

# Function to copy files
remote_copy() {
    local max_attempts=3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if command -v sshpass &> /dev/null; then
            sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -o ConnectTimeout=15 -P "$SERVER_PORT" "$1" "$SERVER_USER@$SERVER_IP:$2" && return 0
        else
            scp -o StrictHostKeyChecking=no -o ConnectTimeout=15 -P "$SERVER_PORT" "$1" "$SERVER_USER@$SERVER_IP:$2" && return 0
        fi
        echo -e "${YELLOW}⚠️  Attempt $attempt failed, retrying...${NC}"
        sleep 3
        attempt=$((attempt + 1))
    done
    return 1
}

# ===========================================
# 1) CONNECT TO SERVER & FIND BACKEND PROCESS
# ===========================================
echo -e "${BLUE}📊 Step 1: Finding Backend Process...${NC}"
echo ""

# Check if Docker is available
DOCKER_AVAILABLE=$(remote_exec "command -v docker &> /dev/null && echo 'yes' || echo 'no'" || echo "no")
echo "Docker available: $DOCKER_AVAILABLE"

# Check if backend container exists
BACKEND_CONTAINER=$(remote_exec "docker ps -a --filter 'name=smokava-backend' --format '{{.Names}}' 2>/dev/null | head -n 1" || echo "")

if [ -n "$BACKEND_CONTAINER" ]; then
    echo -e "${GREEN}✅ Found backend container: $BACKEND_CONTAINER${NC}"

    # Check container status
    CONTAINER_STATUS=$(remote_exec "docker inspect -f '{{.State.Status}}' '$BACKEND_CONTAINER' 2>/dev/null" || echo "not found")
    echo "Container status: $CONTAINER_STATUS"

    if [ "$CONTAINER_STATUS" != "running" ]; then
        echo -e "${YELLOW}⚠️  Container is not running, starting it...${NC}"
        remote_exec "docker start '$BACKEND_CONTAINER'" && echo -e "${GREEN}✅ Container started${NC}"
        sleep 5
    fi

    # Check if backend is listening
    PORT_LISTENING=$(remote_exec "docker exec '$BACKEND_CONTAINER' sh -c 'netstat -tuln 2>/dev/null | grep :5000 || ss -tuln 2>/dev/null | grep :5000 || echo not_listening'" || echo "not_listening")
    if echo "$PORT_LISTENING" | grep -q ":5000"; then
        echo -e "${GREEN}✅ Backend is listening on port 5000${NC}"
    else
        echo -e "${RED}❌ Backend is not listening on port 5000${NC}"
        echo "Checking logs..."
        remote_exec "docker logs '$BACKEND_CONTAINER' --tail 30"
    fi
else
    echo -e "${RED}❌ Backend container not found${NC}"
    echo "Checking if backend directory exists..."

    BACKEND_DIR=$(remote_exec "test -d '$DEPLOY_DIR/backend' && echo 'exists' || echo 'missing'" || echo "missing")
    if [ "$BACKEND_DIR" == "missing" ]; then
        echo -e "${RED}❌ Backend directory not found at $DEPLOY_DIR/backend${NC}"
        echo "Please check deployment directory or deploy backend first"
        exit 1
    fi

    echo "Backend directory exists, checking docker-compose..."
    COMPOSE_AVAILABLE=$(remote_exec "cd '$DEPLOY_DIR' && (command -v docker-compose &> /dev/null || docker compose version &> /dev/null) && echo 'yes' || echo 'no'" || echo "no")

    if [ "$COMPOSE_AVAILABLE" == "yes" ]; then
        echo "Starting backend via docker-compose..."
        remote_exec "cd '$DEPLOY_DIR' && docker compose up -d backend || docker-compose up -d backend"
        sleep 10
    else
        echo -e "${RED}❌ Docker Compose not available${NC}"
        exit 1
    fi
fi

# Check PM2
PM2_PROCESS=$(remote_exec "pm2 list 2>/dev/null | grep -i smokava || echo 'not_found'" || echo "not_found")
if [ "$PM2_PROCESS" != "not_found" ] && echo "$PM2_PROCESS" | grep -q "online"; then
    echo -e "${GREEN}✅ Found PM2 process running${NC}"
fi

# Check systemd
SYSTEMD_SERVICE=$(remote_exec "systemctl is-active smokava-backend 2>/dev/null || echo 'inactive'" || echo "inactive")
if [ "$SYSTEMD_SERVICE" == "active" ]; then
    echo -e "${GREEN}✅ Found systemd service running${NC}"
fi

# ===========================================
# 2) VALIDATE ENVIRONMENT VARIABLES
# ===========================================
echo ""
echo -e "${BLUE}📊 Step 2: Validating Environment Variables...${NC}"
echo ""

KAVENEGAR_API_KEY="4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D"
KAVENEGAR_TEMPLATE="otp-v2"

# Check backend .env file
ENV_FILE="$DEPLOY_DIR/backend/.env"
ENV_EXISTS=$(remote_exec "test -f '$ENV_FILE' && echo 'exists' || echo 'missing'" || echo "missing")

if [ "$ENV_EXISTS" == "missing" ]; then
    echo -e "${YELLOW}⚠️  .env file not found, creating it...${NC}"
    remote_exec "mkdir -p '$DEPLOY_DIR/backend' && cat > '$ENV_FILE' << 'ENVEOF'
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/smokava
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
KAVENEGAR_API_KEY=$KAVENEGAR_API_KEY
KAVENEGAR_TEMPLATE=$KAVENEGAR_TEMPLATE
KAVENEGAR_SENDER=
API_BASE_URL=https://api.smokava.com
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com
OTP_DEBUG_SECRET_KEY=smokava-otp-debug-2024
ENVEOF
" && echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"

    # Check for localhost references
    LOCALHOST_COUNT=$(remote_exec "grep -c 'localhost\|127.0.0.1' '$ENV_FILE' 2>/dev/null || echo '0'" || echo "0")
    if [ "$LOCALHOST_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Found localhost references, fixing...${NC}"
        remote_exec "
        sed -i 's|http://localhost|https://api.smokava.com|g' '$ENV_FILE'
        sed -i 's|http://127.0.0.1|https://api.smokava.com|g' '$ENV_FILE'
        sed -i 's|mongodb://localhost|mongodb://mongodb|g' '$ENV_FILE'
        "
        echo -e "${GREEN}✅ Fixed localhost references${NC}"
    fi

    # Ensure Kavenegar credentials are set
    HAS_KAVENEGAR=$(remote_exec "grep -q 'KAVENEGAR_API_KEY' '$ENV_FILE' && echo 'yes' || echo 'no'" || echo "no")
    if [ "$HAS_KAVENEGAR" == "no" ] || [ -z "$(remote_exec "grep 'KAVENEGAR_API_KEY=' '$ENV_FILE' | cut -d= -f2" || echo "")" ]; then
        echo -e "${YELLOW}⚠️  Kavenegar API key missing, adding...${NC}"
        remote_exec "
        grep -q 'KAVENEGAR_API_KEY' '$ENV_FILE' && \
            sed -i 's|KAVENEGAR_API_KEY=.*|KAVENEGAR_API_KEY=$KAVENEGAR_API_KEY|g' '$ENV_FILE' || \
            echo 'KAVENEGAR_API_KEY=$KAVENEGAR_API_KEY' >> '$ENV_FILE'
        grep -q 'KAVENEGAR_TEMPLATE' '$ENV_FILE' && \
            sed -i 's|KAVENEGAR_TEMPLATE=.*|KAVENEGAR_TEMPLATE=$KAVENEGAR_TEMPLATE|g' '$ENV_FILE' || \
            echo 'KAVENEGAR_TEMPLATE=$KAVENEGAR_TEMPLATE' >> '$ENV_FILE'
        "
        echo -e "${GREEN}✅ Kavenegar credentials added${NC}"
    fi

    # Ensure production URLs are set
    remote_exec "
    grep -q '^API_BASE_URL=' '$ENV_FILE' && \
        sed -i 's|^API_BASE_URL=.*|API_BASE_URL=https://api.smokava.com|g' '$ENV_FILE' || \
        echo 'API_BASE_URL=https://api.smokava.com' >> '$ENV_FILE'
    grep -q '^FRONTEND_URL=' '$ENV_FILE' && \
        sed -i 's|^FRONTEND_URL=.*|FRONTEND_URL=https://smokava.com|g' '$ENV_FILE' || \
        echo 'FRONTEND_URL=https://smokava.com' >> '$ENV_FILE'
    "
    echo -e "${GREEN}✅ Production URLs verified${NC}"
fi

# Verify environment variables in container
if [ -n "$BACKEND_CONTAINER" ]; then
    echo "Checking environment variables in container..."
    CONTAINER_ENV=$(remote_exec "docker exec '$BACKEND_CONTAINER' env | grep -E 'KAVENEGAR|API_BASE_URL|NODE_ENV|MONGODB' | sort" || echo "")
    if [ -n "$CONTAINER_ENV" ]; then
        echo "$CONTAINER_ENV"
    else
        echo -e "${YELLOW}⚠️  Could not read container environment${NC}"
    fi
fi

# ===========================================
# 3) FIX NGINX CONFIG FOR API
# ===========================================
echo ""
echo -e "${BLUE}📊 Step 3: Fixing Nginx Configuration...${NC}"
echo ""

# Check if Nginx config exists
NGINX_CONFIG="/etc/nginx/sites-available/api.smokava.com"
NGINX_EXISTS=$(remote_exec "test -f '$NGINX_CONFIG' && echo 'exists' || echo 'missing'" || echo "missing")

if [ "$NGINX_EXISTS" == "missing" ]; then
    echo -e "${YELLOW}⚠️  Nginx config not found, creating it...${NC}"
    remote_exec "sudo tee '$NGINX_CONFIG' > /dev/null << 'NGINXEOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.smokava.com;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS - API Backend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.smokava.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.smokava.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.smokava.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\" always;
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;

    client_max_body_size 50M;

    # Proxy to backend Docker container
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Handle CORS preflight
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '\$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' '86400' always;
            return 204;
        }
    }
}
NGINXEOF
" && echo -e "${GREEN}✅ Nginx config created${NC}"
else
    echo -e "${GREEN}✅ Nginx config exists${NC}"

    # Check if proxy_pass is correct
    PROXY_PASS=$(remote_exec "grep 'proxy_pass' '$NGINX_CONFIG' | head -1" || echo "")
    if echo "$PROXY_PASS" | grep -q "localhost:5000\|127.0.0.1:5000"; then
        echo -e "${GREEN}✅ proxy_pass is correct${NC}"
    else
        echo -e "${YELLOW}⚠️  Fixing proxy_pass...${NC}"
        remote_exec "sudo sed -i 's|proxy_pass http://.*:.*;|proxy_pass http://127.0.0.1:5000;|g' '$NGINX_CONFIG'"
        echo -e "${GREEN}✅ proxy_pass fixed${NC}"
    fi
fi

# Enable config
remote_exec "sudo ln -sf '$NGINX_CONFIG' /etc/nginx/sites-enabled/api.smokava.com" && echo -e "${GREEN}✅ Config enabled${NC}"

# Test Nginx config
NGINX_TEST=$(remote_exec "sudo nginx -t 2>&1" || echo "failed")
if echo "$NGINX_TEST" | grep -q "successful"; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
    remote_exec "sudo systemctl reload nginx" && echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors:${NC}"
    echo "$NGINX_TEST"
fi

# ===========================================
# 4) VERIFY HTTPS CERTIFICATES
# ===========================================
echo ""
echo -e "${BLUE}📊 Step 4: Verifying HTTPS Certificates...${NC}"
echo ""

SSL_CERT="/etc/letsencrypt/live/api.smokava.com/fullchain.pem"
SSL_KEY="/etc/letsencrypt/live/api.smokava.com/privkey.pem"

SSL_EXISTS=$(remote_exec "test -f '$SSL_CERT' && test -f '$SSL_KEY' && echo 'exists' || echo 'missing'" || echo "missing")

if [ "$SSL_EXISTS" == "missing" ]; then
    echo -e "${YELLOW}⚠️  SSL certificate not found, obtaining it...${NC}"

    # First, ensure HTTP config is working
    remote_exec "sudo systemctl reload nginx"
    sleep 2

    # Try to get certificate
    CERT_RESULT=$(remote_exec "sudo certbot certonly --nginx -d api.smokava.com --non-interactive --agree-tos --email admin@smokava.com --keep-until-expiring 2>&1" || echo "failed")

    if echo "$CERT_RESULT" | grep -q "Successfully received certificate\|Certificate is saved"; then
        echo -e "${GREEN}✅ SSL certificate obtained${NC}"
        remote_exec "sudo systemctl reload nginx"
    else
        echo -e "${YELLOW}⚠️  Certbot failed, trying standalone mode...${NC}"
        remote_exec "sudo systemctl stop nginx && \
            sudo certbot certonly --standalone -d api.smokava.com --non-interactive --agree-tos --email admin@smokava.com && \
            sudo systemctl start nginx" && echo -e "${GREEN}✅ SSL certificate obtained (standalone)${NC}"
    fi
else
    echo -e "${GREEN}✅ SSL certificate exists${NC}"

    # Check certificate expiry
    CERT_EXPIRY=$(remote_exec "sudo openssl x509 -enddate -noout -in '$SSL_CERT' 2>/dev/null | cut -d= -f2" || echo "")
    if [ -n "$CERT_EXPIRY" ]; then
        echo "Certificate expires: $CERT_EXPIRY"
    fi
fi

# ===========================================
# 5) TEST THE OTP FLOW END-TO-END
# ===========================================
echo ""
echo -e "${BLUE}📊 Step 5: Testing OTP Flow End-to-End...${NC}"
echo ""

# Restart backend to ensure env vars are loaded
if [ -n "$BACKEND_CONTAINER" ]; then
    echo "Restarting backend to load new environment variables..."
    remote_exec "docker restart '$BACKEND_CONTAINER'"
    sleep 8
    echo -e "${GREEN}✅ Backend restarted${NC}"
fi

# Test root endpoint
echo ""
echo "Test 1: Root endpoint"
ROOT_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://api.smokava.com/ --max-time 10 || echo "000")
if [ "$ROOT_TEST" == "200" ]; then
    echo -e "${GREEN}✅ Root endpoint: HTTP $ROOT_TEST${NC}"
else
    echo -e "${RED}❌ Root endpoint: HTTP $ROOT_TEST${NC}"
fi

# Test OTP send endpoint
echo ""
echo "Test 2: OTP send endpoint"
OTP_RESPONSE=$(curl -s -X POST https://api.smokava.com/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"09302593819"}' \
    -w "\nHTTP_CODE:%{http_code}\n" \
    --max-time 30 2>&1 || echo "FAILED")

if echo "$OTP_RESPONSE" | grep -q "HTTP_CODE:200\|HTTP_CODE:201"; then
    HTTP_CODE=$(echo "$OTP_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    echo -e "${GREEN}✅ OTP send endpoint: HTTP $HTTP_CODE${NC}"
    echo "Response:"
    echo "$OTP_RESPONSE" | grep -v "HTTP_CODE" | head -5
else
    echo -e "${RED}❌ OTP send endpoint failed${NC}"
    echo "Response:"
    echo "$OTP_RESPONSE" | head -10
fi

# Check backend logs for Kavenegar activity
echo ""
echo "Test 3: Checking backend logs for Kavenegar activity..."
KAVENEGAR_LOGS=$(remote_exec "docker logs '$BACKEND_CONTAINER' --tail 50 2>&1 | grep -E '(Kavenegar|SMS|send-otp|OTP sent)' | tail -5" || echo "No logs")
if [ -n "$KAVENEGAR_LOGS" ] && [ "$KAVENEGAR_LOGS" != "No logs" ]; then
    echo -e "${GREEN}✅ Kavenegar activity found in logs:${NC}"
    echo "$KAVENEGAR_LOGS"
else
    echo -e "${YELLOW}⚠️  No recent Kavenegar activity in logs${NC}"
fi

# ===========================================
# 6) CLEAN UP & FINAL VERIFICATION
# ===========================================
echo ""
echo -e "${BLUE}📊 Step 6: Final Verification...${NC}"
echo ""

# Check backend container is running
FINAL_STATUS=$(remote_exec "docker inspect -f '{{.State.Status}}' '$BACKEND_CONTAINER' 2>/dev/null" || echo "not found")
if [ "$FINAL_STATUS" == "running" ]; then
    echo -e "${GREEN}✅ Backend container: Running${NC}"
else
    echo -e "${RED}❌ Backend container: $FINAL_STATUS${NC}"
fi

# Check Nginx status
NGINX_STATUS=$(remote_exec "systemctl is-active nginx 2>/dev/null || echo 'inactive'" || echo "inactive")
if [ "$NGINX_STATUS" == "active" ]; then
    echo -e "${GREEN}✅ Nginx: Active${NC}"
else
    echo -e "${RED}❌ Nginx: $NGINX_STATUS${NC}"
fi

# Check SSL
SSL_VALID=$(remote_exec "test -f '$SSL_CERT' && echo 'valid' || echo 'missing'" || echo "missing")
if [ "$SSL_VALID" == "valid" ]; then
    echo -e "${GREEN}✅ SSL Certificate: Valid${NC}"
else
    echo -e "${RED}❌ SSL Certificate: Missing${NC}"
fi

# Final API test
echo ""
echo "Final API connectivity test..."
FINAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://api.smokava.com/ --max-time 10 || echo "000")
if [ "$FINAL_TEST" == "200" ]; then
    echo -e "${GREEN}✅ API Connectivity: Working (HTTP $FINAL_TEST)${NC}"
else
    echo -e "${RED}❌ API Connectivity: Failed (HTTP $FINAL_TEST)${NC}"
fi

# ===========================================
# SUMMARY
# ===========================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}SUMMARY${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${GREEN}✓ Backend Status:${NC} $FINAL_STATUS"
echo -e "${GREEN}✓ Nginx Status:${NC} $NGINX_STATUS"
echo -e "${GREEN}✓ SSL Status:${NC} $SSL_VALID"
echo -e "${GREEN}✓ API Connectivity:${NC} HTTP $FINAL_TEST"
echo ""
echo -e "${BLUE}Test OTP endpoint:${NC}"
echo "curl -X POST https://api.smokava.com/api/auth/send-otp \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"phoneNumber\":\"09302593819\"}'"
echo ""
echo -e "${BLUE}View backend logs:${NC}"
echo "ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP 'docker logs -f $BACKEND_CONTAINER'"
echo ""

