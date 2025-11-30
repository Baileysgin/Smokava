# 🔧 ERR_CONNECTION_CLOSED Fix Report

## Problem Summary

The API endpoint `https://api.smokava.com/api/auth/send-otp` was failing with `ERR_CONNECTION_CLOSED` error when called from the frontend.

## Root Cause

1. **Missing Nginx Configuration**: The Nginx config file for `api.smokava.com` was missing from `/etc/nginx/sites-available/`
2. **Missing SSL Certificate**: No SSL certificate was installed for `api.smokava.com`
3. **Backend was running correctly**: Docker container was healthy and responding on `localhost:5000`

## Fixes Applied

### 1. Created Nginx Configuration
- **File**: `/etc/nginx/sites-available/api.smokava.com`
- **Content**:
  - HTTP server block (port 80) that redirects to HTTPS
  - HTTPS server block (port 443) that proxies to `http://localhost:5000`
  - Proper SSL configuration
  - Security headers (HSTS, X-Frame-Options, etc.)
  - CORS handling for preflight requests
  - Timeout settings (60s for connect, send, read)

### 2. Obtained SSL Certificate
- **Method**: Let's Encrypt via Certbot
- **Certificate Path**: `/etc/letsencrypt/live/api.smokava.com/`
- **Expiry**: February 25, 2026
- **Auto-renewal**: Configured via Certbot

### 3. Enabled Nginx Configuration
- Created symlink: `/etc/nginx/sites-enabled/api.smokava.com` → `/etc/nginx/sites-available/api.smokava.com`
- Tested configuration: `nginx -t`
- Reloaded Nginx: `systemctl reload nginx`

## Verification Results

### ✅ Backend Status
- **Container**: `smokava-backend` is running
- **Port**: Listening on port 5000
- **Health Check**: Responding correctly
- **Logs**: SMS sending confirmed via Kavenegar API

### ✅ Nginx Status
- **Service**: Running
- **Configuration**: Valid (warnings about duplicate server names are non-critical)
- **SSL**: Certificate installed and valid
- **Proxy**: Correctly forwarding to `localhost:5000`

### ✅ API Endpoints
- **Root endpoint**: `https://api.smokava.com/` → HTTP 200 ✅
- **OTP endpoint**: `https://api.smokava.com/api/auth/send-otp` → HTTP 200 ✅
- **SMS Delivery**: Confirmed working via Kavenegar API ✅

## Files Modified

### Server-Side (Remote)
1. `/etc/nginx/sites-available/api.smokava.com` - **Created**
2. `/etc/nginx/sites-enabled/api.smokava.com` - **Created (symlink)**

### Local Scripts (Created)
1. `scripts/diagnose-and-fix-connection.sh` - Comprehensive diagnostic script
2. `scripts/remote-diagnose-connection.sh` - Remote diagnostic runner
3. `scripts/fix-api-nginx-ssl.sh` - Nginx and SSL setup script
4. `scripts/verify-api-fix.sh` - Verification script
5. `scripts/fix-nginx-conflicts.sh` - Conflict resolution script
6. `scripts/fix-all-nginx-conflicts.sh` - Comprehensive conflict fix

## Nginx Configuration Details

```nginx
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
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:...';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

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

        # Handle CORS preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' '86400' always;
            return 204;
        }
    }
}
```

## Test Results

### Direct API Test
```bash
curl https://api.smokava.com/
# Response: HTTP 200 ✅

curl -X POST https://api.smokava.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"09302593819"}'
# Response: HTTP 200 ✅
# Body: {"message":"OTP sent successfully","expiresIn":300}
```

### SMS Delivery
- **Kavenegar API**: Successfully called
- **SMS Status**: Sent successfully to 09302593819
- **Backend Logs**: Confirmed SMS delivery

## Known Issues (Non-Critical)

1. **Nginx Warnings**: There are warnings about "conflicting server name" for `api.smokava.com`. These are warnings, not errors, and Nginx correctly uses the first matching server block. The warnings occur because other config files (like `smokava-docker.conf`) also define `api.smokava.com`, but those are ignored.

## Next Steps

1. ✅ **API is working** - `ERR_CONNECTION_CLOSED` is fixed
2. ✅ **SSL is configured** - HTTPS is working
3. ✅ **SMS is being sent** - OTP delivery confirmed
4. 🌐 **Test from frontend**: Visit `https://smokava.com/auth` and test the full OTP flow

## Useful Commands

### Check Backend Status
```bash
ssh root@91.107.241.245 'docker ps | grep smokava-backend'
ssh root@91.107.241.245 'docker logs -f smokava-backend'
```

### Check Nginx Status
```bash
ssh root@91.107.241.245 'sudo systemctl status nginx'
ssh root@91.107.241.245 'sudo nginx -t'
ssh root@91.107.241.245 'sudo tail -f /var/log/nginx/error.log'
```

### Test API
```bash
curl https://api.smokava.com/
curl -X POST https://api.smokava.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"09302593819"}'
```

## Summary

✅ **Problem**: `ERR_CONNECTION_CLOSED` when calling `https://api.smokava.com/api/auth/send-otp`

✅ **Root Cause**: Missing Nginx configuration and SSL certificate for `api.smokava.com`

✅ **Solution**:
1. Created Nginx configuration file
2. Obtained SSL certificate via Let's Encrypt
3. Enabled and reloaded Nginx

✅ **Result**: API is now accessible via HTTPS, OTP endpoint is working, SMS delivery confirmed

✅ **Status**: **FIXED** - The `ERR_CONNECTION_CLOSED` error is resolved. The API is now accessible and the OTP system is fully functional.



