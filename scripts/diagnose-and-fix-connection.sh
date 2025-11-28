#!/bin/bash

# ===========================================
# COMPREHENSIVE DIAGNOSTIC & FIX SCRIPT
# For ERR_CONNECTION_CLOSED on api.smokava.com
# ===========================================

set -e

echo "🔍 ============================================"
echo "🔍 DIAGNOSING CONNECTION ISSUES"
echo "🔍 ============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# ===========================================
# 1. CHECK BACKEND STATUS
# ===========================================
echo "📊 Step 1: Checking Backend Status..."
echo ""

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check Docker containers
echo "Checking Docker containers..."
BACKEND_CONTAINER=$(docker ps -a --filter "name=smokava-backend" --format "{{.Names}}" | head -n 1)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${RED}❌ Backend container not found${NC}"
    echo "Attempting to start containers..."
    cd /root/Smokava || cd ~/Smokava || exit 1
    docker compose up -d backend || docker-compose up -d backend
    sleep 5
    BACKEND_CONTAINER=$(docker ps -a --filter "name=smokava-backend" --format "{{.Names}}" | head -n 1)
fi

if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${RED}❌ Failed to find or start backend container${NC}"
    exit 1
fi

# Check if container is running
CONTAINER_STATUS=$(docker inspect -f '{{.State.Status}}' "$BACKEND_CONTAINER" 2>/dev/null || echo "not found")

if [ "$CONTAINER_STATUS" != "running" ]; then
    echo -e "${YELLOW}⚠️  Backend container is not running (status: $CONTAINER_STATUS)${NC}"
    echo "Starting container..."
    docker start "$BACKEND_CONTAINER"
    sleep 5
    CONTAINER_STATUS=$(docker inspect -f '{{.State.Status}}' "$BACKEND_CONTAINER" 2>/dev/null || echo "not found")
fi

if [ "$CONTAINER_STATUS" == "running" ]; then
    print_status 0 "Backend container is running"
else
    print_status 1 "Backend container failed to start"
    echo "Checking logs..."
    docker logs "$BACKEND_CONTAINER" --tail 50
    exit 1
fi

# Check if backend is listening on port 5000
echo ""
echo "Checking if backend is listening on port 5000..."
if docker exec "$BACKEND_CONTAINER" sh -c "netstat -tuln 2>/dev/null | grep :5000 || ss -tuln 2>/dev/null | grep :5000 || true" | grep -q ":5000"; then
    print_status 0 "Backend is listening on port 5000"
else
    print_status 1 "Backend is NOT listening on port 5000"
    echo "Recent backend logs:"
    docker logs "$BACKEND_CONTAINER" --tail 20
fi

# Test backend directly from container
echo ""
echo "Testing backend health from inside container..."
HEALTH_CHECK=$(docker exec "$BACKEND_CONTAINER" sh -c "wget -qO- http://localhost:5000/ 2>/dev/null || curl -s http://localhost:5000/ 2>/dev/null || echo 'FAILED'")
if echo "$HEALTH_CHECK" | grep -q "Smokava API"; then
    print_status 0 "Backend health check passed"
else
    print_status 1 "Backend health check failed"
    echo "Response: $HEALTH_CHECK"
fi

# ===========================================
# 2. CHECK NGINX STATUS
# ===========================================
echo ""
echo "📊 Step 2: Checking Nginx Status..."
echo ""

if ! command -v nginx &> /dev/null && ! systemctl is-active --quiet nginx; then
    echo -e "${RED}❌ Nginx is not installed or not running${NC}"
    exit 1
fi

# Check Nginx status
if systemctl is-active --quiet nginx; then
    print_status 0 "Nginx is running"
else
    print_status 1 "Nginx is not running"
    echo "Starting Nginx..."
    sudo systemctl start nginx
    sleep 2
    if systemctl is-active --quiet nginx; then
        print_status 0 "Nginx started successfully"
    else
        print_status 1 "Failed to start Nginx"
        sudo systemctl status nginx
        exit 1
    fi
fi

# Check Nginx configuration
echo ""
echo "Checking Nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    print_status 0 "Nginx configuration is valid"
else
    print_status 1 "Nginx configuration has errors"
    sudo nginx -t
    exit 1
fi

# Check if api.smokava.com config exists
NGINX_CONFIG="/etc/nginx/sites-available/api.smokava.com"
if [ -f "$NGINX_CONFIG" ]; then
    print_status 0 "Nginx config file exists: $NGINX_CONFIG"

    # Check if it's enabled
    if [ -L "/etc/nginx/sites-enabled/api.smokava.com" ]; then
        print_status 0 "Nginx config is enabled"
    else
        echo -e "${YELLOW}⚠️  Config file exists but is not enabled${NC}"
        echo "Enabling config..."
        sudo ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/api.smokava.com
        sudo nginx -t && sudo systemctl reload nginx
        print_status 0 "Config enabled and Nginx reloaded"
    fi

    # Check proxy_pass configuration
    if grep -q "proxy_pass.*localhost:5000" "$NGINX_CONFIG"; then
        print_status 0 "proxy_pass points to localhost:5000 (correct for Docker)"
    else
        print_status 1 "proxy_pass configuration may be incorrect"
        echo "Current proxy_pass:"
        grep "proxy_pass" "$NGINX_CONFIG" || echo "Not found"
    fi
else
    print_status 1 "Nginx config file not found: $NGINX_CONFIG"
    echo "Creating Nginx config..."

    # Create config from template
    sudo mkdir -p /etc/nginx/sites-available
    sudo tee "$NGINX_CONFIG" > /dev/null << 'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.smokava.com;
    return 301 https://$server_name$request_uri;
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

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    client_max_body_size 50M;

    # Proxy to backend Docker container
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

    sudo ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/api.smokava.com
    sudo nginx -t && sudo systemctl reload nginx
    print_status 0 "Nginx config created and enabled"
fi

# ===========================================
# 3. CHECK SSL CERTIFICATES
# ===========================================
echo ""
echo "📊 Step 3: Checking SSL Certificates..."
echo ""

SSL_CERT="/etc/letsencrypt/live/api.smokava.com/fullchain.pem"
SSL_KEY="/etc/letsencrypt/live/api.smokava.com/privkey.pem"

if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
    print_status 0 "SSL certificate files exist"

    # Check certificate expiry
    CERT_EXPIRY=$(sudo openssl x509 -enddate -noout -in "$SSL_CERT" 2>/dev/null | cut -d= -f2)
    if [ -n "$CERT_EXPIRY" ]; then
        EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y" "$CERT_EXPIRY" +%s 2>/dev/null || echo "0")
        NOW_EPOCH=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

        if [ $DAYS_LEFT -gt 30 ]; then
            print_status 0 "SSL certificate is valid (expires in $DAYS_LEFT days)"
        elif [ $DAYS_LEFT -gt 0 ]; then
            echo -e "${YELLOW}⚠️  SSL certificate expires in $DAYS_LEFT days${NC}"
        else
            print_status 1 "SSL certificate has expired"
            echo "Renewing certificate..."
            sudo certbot renew --cert-name api.smokava.com
            sudo systemctl reload nginx
        fi
    fi
else
    print_status 1 "SSL certificate files not found"
    echo "Installing SSL certificate..."
    sudo certbot --nginx -d api.smokava.com --non-interactive --agree-tos --email admin@smokava.com || {
        echo -e "${RED}❌ Failed to install SSL certificate${NC}"
        echo "You may need to run: sudo certbot --nginx -d api.smokava.com"
        exit 1
    }
    sudo systemctl reload nginx
    print_status 0 "SSL certificate installed"
fi

# ===========================================
# 4. TEST API DIRECTLY ON SERVER
# ===========================================
echo ""
echo "📊 Step 4: Testing API Directly on Server..."
echo ""

# Test localhost:5000
echo "Testing backend on localhost:5000..."
LOCAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/ || echo "000")
if [ "$LOCAL_TEST" == "200" ]; then
    print_status 0 "Backend responds on localhost:5000"
else
    print_status 1 "Backend does not respond on localhost:5000 (HTTP $LOCAL_TEST)"
fi

# Test via HTTPS
echo ""
echo "Testing API via HTTPS (api.smokava.com)..."
HTTPS_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://api.smokava.com/ || echo "000")
if [ "$HTTPS_TEST" == "200" ]; then
    print_status 0 "API responds via HTTPS"
else
    print_status 1 "API does not respond via HTTPS (HTTP $HTTPS_TEST)"
    echo "Testing with verbose output..."
    curl -v https://api.smokava.com/ 2>&1 | head -20
fi

# Test OTP endpoint
echo ""
echo "Testing OTP endpoint..."
OTP_TEST=$(curl -s -X POST https://api.smokava.com/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"09302593819"}' \
    -o /dev/null -w "%{http_code}" 2>&1 || echo "000")

if [ "$OTP_TEST" == "200" ] || [ "$OTP_TEST" == "201" ]; then
    print_status 0 "OTP endpoint responds (HTTP $OTP_TEST)"
else
    print_status 1 "OTP endpoint failed (HTTP $OTP_TEST)"
    echo "Full response:"
    curl -X POST https://api.smokava.com/api/auth/send-otp \
        -H "Content-Type: application/json" \
        -d '{"phoneNumber":"09302593819"}' 2>&1 | head -30
fi

# ===========================================
# 5. CHECK BACKEND LOGS
# ===========================================
echo ""
echo "📊 Step 5: Checking Backend Logs..."
echo ""
echo "Recent backend logs (last 20 lines):"
docker logs "$BACKEND_CONTAINER" --tail 20

# ===========================================
# 6. SUMMARY
# ===========================================
echo ""
echo "🔍 ============================================"
echo "🔍 DIAGNOSIS COMPLETE"
echo "🔍 ============================================"
echo ""

# Final test
echo "Running final connectivity test..."
FINAL_TEST=$(curl -s -X POST https://api.smokava.com/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"09302593819"}' \
    -w "\nHTTP_CODE:%{http_code}\n" 2>&1)

if echo "$FINAL_TEST" | grep -q "HTTP_CODE:200\|HTTP_CODE:201"; then
    echo -e "${GREEN}✅ SUCCESS: API is working correctly!${NC}"
    echo ""
    echo "Response:"
    echo "$FINAL_TEST" | grep -v "HTTP_CODE" | head -10
else
    echo -e "${RED}❌ FAILURE: API is still not working${NC}"
    echo ""
    echo "Full response:"
    echo "$FINAL_TEST"
    echo ""
    echo "Next steps:"
    echo "1. Check backend logs: docker logs $BACKEND_CONTAINER"
    echo "2. Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
    echo "3. Verify Docker network: docker network ls"
    echo "4. Check container environment: docker exec $BACKEND_CONTAINER env | grep -E 'PORT|MONGODB|NODE_ENV'"
fi

echo ""
echo "📋 Useful commands:"
echo "   - View backend logs: docker logs -f $BACKEND_CONTAINER"
echo "   - Restart backend: docker restart $BACKEND_CONTAINER"
echo "   - Check Nginx: sudo nginx -t && sudo systemctl status nginx"
echo "   - Test API: curl -X POST https://api.smokava.com/api/auth/send-otp -H 'Content-Type: application/json' -d '{\"phoneNumber\":\"09302593819\"}'"
