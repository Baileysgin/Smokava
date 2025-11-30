#!/bin/bash

# ===========================================
# FIX API NGINX CONFIGURATION AND SSL
# ===========================================

set -e

SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"

echo "🔧 Fixing API Nginx Configuration and SSL"
echo "=========================================="
echo ""

# Function to execute remote commands
remote_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
    else
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
    fi
}

echo "📝 Step 1: Creating temporary HTTP-only Nginx config..."
remote_exec "sudo tee /etc/nginx/sites-available/api.smokava.com > /dev/null << 'NGINXEOF'
# Temporary HTTP config for SSL certificate generation
server {
    listen 80;
    listen [::]:80;
    server_name api.smokava.com;

    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Proxy to backend Docker container
    location / {
        proxy_pass http://localhost:5000;
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
    }
}
NGINXEOF
" && echo "✅ Temporary config created"

echo ""
echo "🔗 Step 2: Enabling Nginx config..."
remote_exec "sudo ln -sf /etc/nginx/sites-available/api.smokava.com /etc/nginx/sites-enabled/api.smokava.com && \
    sudo nginx -t && \
    sudo systemctl reload nginx" && echo "✅ Nginx config enabled and reloaded"

echo ""
echo "🔒 Step 3: Obtaining SSL certificate..."
remote_exec "sudo certbot certonly --nginx -d api.smokava.com --non-interactive --agree-tos --email admin@smokava.com --keep-until-expiring" && echo "✅ SSL certificate obtained" || {
    echo "⚠️  Certbot failed, trying standalone mode..."
    remote_exec "sudo systemctl stop nginx && \
        sudo certbot certonly --standalone -d api.smokava.com --non-interactive --agree-tos --email admin@smokava.com && \
        sudo systemctl start nginx" && echo "✅ SSL certificate obtained (standalone mode)"
}

echo ""
echo "📝 Step 4: Updating Nginx config with HTTPS..."
remote_exec "sudo tee /etc/nginx/sites-available/api.smokava.com > /dev/null << 'NGINXEOF'
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
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\" always;
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;

    # Increase body size for image uploads
    client_max_body_size 50M;

    # Proxy to backend Docker container
    location / {
        proxy_pass http://localhost:5000;
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
" && echo "✅ HTTPS config created"

echo ""
echo "✅ Step 5: Testing and reloading Nginx..."
remote_exec "sudo nginx -t && sudo systemctl reload nginx" && echo "✅ Nginx reloaded successfully"

echo ""
echo "🧪 Step 6: Testing API endpoints..."
echo ""
echo "Testing HTTP (should redirect to HTTPS):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://api.smokava.com/ || echo "000")
if [ "$HTTP_CODE" == "301" ] || [ "$HTTP_CODE" == "302" ]; then
    echo "✅ HTTP redirects to HTTPS (HTTP $HTTP_CODE)"
else
    echo "⚠️  HTTP response: $HTTP_CODE"
fi

echo ""
echo "Testing HTTPS:"
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.smokava.com/ || echo "000")
if [ "$HTTPS_CODE" == "200" ]; then
    echo "✅ HTTPS is working (HTTP $HTTPS_CODE)"
else
    echo "⚠️  HTTPS response: $HTTPS_CODE"
fi

echo ""
echo "Testing OTP endpoint:"
OTP_RESPONSE=$(curl -s -X POST https://api.smokava.com/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"09302593819"}' \
    -w "\nHTTP_CODE:%{http_code}\n" 2>&1 || echo "FAILED")

if echo "$OTP_RESPONSE" | grep -q "HTTP_CODE:200\|HTTP_CODE:201"; then
    echo "✅ OTP endpoint is working!"
    echo "Response:"
    echo "$OTP_RESPONSE" | grep -v "HTTP_CODE" | head -5
else
    echo "⚠️  OTP endpoint response:"
    echo "$OTP_RESPONSE" | head -10
fi

echo ""
echo "✅ Fix complete!"
echo ""
echo "📋 Summary:"
echo "   - Nginx config: /etc/nginx/sites-available/api.smokava.com"
echo "   - SSL certificate: /etc/letsencrypt/live/api.smokava.com/"
echo "   - Test API: curl https://api.smokava.com/"
echo "   - Test OTP: curl -X POST https://api.smokava.com/api/auth/send-otp -H 'Content-Type: application/json' -d '{\"phoneNumber\":\"09302593819\"}'"



