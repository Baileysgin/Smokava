# eNAMAD Technical Verification Setup Guide

This document contains all the steps and configurations needed to pass eNAMAD technical verification for smokava.com.

## ✅ Completed Setup Steps

### 1. TXT Verification File

**Status**: ✅ Complete

The verification file `28609673.txt` has been created in multiple locations to ensure accessibility:

- `/frontend/public/28609673.txt` - Primary location (Next.js public folder)
- `/frontend/public/enamad/28609673.txt` - Backup location
- `/frontend/app/28609673.txt/route.ts` - Route handler as fallback

**Access URL**: `https://smokava.com/28609673.txt`

**Nginx Configuration**: Updated to ensure the file is accessible without redirects or caching:
- Added specific location block for `/28609673.txt`
- Added location block for `/enamad/` folder
- Set `Cache-Control: no-cache, no-store, must-revalidate`
- Ensured plain text content type

**Verification**:
```bash
curl -I https://smokava.com/28609673.txt
# Should return 200 OK with Content-Type: text/plain
```

---

### 2. HTTPS Verification

**Status**: ⚠️ **REQUIRES SETUP**

Currently, the nginx configuration is set to HTTP only. HTTPS must be enabled for eNAMAD verification.

#### Let's Encrypt SSL Setup Instructions

**Prerequisites**:
- Domain `smokava.com` and `www.smokava.com` pointing to your server
- Port 80 and 443 open in firewall
- Certbot installed on server

**Step 1: Install Certbot**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

**Step 2: Obtain SSL Certificate**

```bash
sudo certbot --nginx -d smokava.com -d www.smokava.com
```

**Step 3: Update Nginx Configuration**

After obtaining the certificate, update `/etc/nginx/sites-available/smokava-docker.conf` or your nginx config:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name smokava.com www.smokava.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Main server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name smokava.com www.smokava.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/smokava.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smokava.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # ... rest of your configuration ...
}
```

**Step 4: Auto-Renewal Setup**

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job, but verify:
sudo systemctl status certbot.timer
```

**Step 5: Reload Nginx**

```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

**Verification**:
```bash
curl -I https://smokava.com
# Should return 200 OK with HTTPS
```

---

### 3. Email Domain Verification (DNS Records)

**Status**: ⚠️ **REQUIRES DNS CONFIGURATION**

To enable `info@smokava.com` email, add the following DNS TXT records in your DNS provider (Cloudflare, etc.):

#### SPF Record (Sender Policy Framework)

**Type**: TXT
**Name**: `@` (or `smokava.com`)
**Value**:
```
v=spf1 include:_spf.google.com ~all
```

**Alternative** (if using custom mail server):
```
v=spf1 mx a:mail.smokava.com ~all
```

#### DKIM Record (DomainKeys Identified Mail)

**Note**: DKIM requires a public key from your email provider. If using Gmail/Google Workspace:

1. Go to Google Admin Console → Apps → Google Workspace → Gmail → Authenticate email
2. Generate DKIM key
3. Add the provided TXT record

**Type**: TXT
**Name**: `google._domainkey` (or provider-specific selector)
**Value**: (Provided by your email provider)
```
v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

#### DMARC Record (Domain-based Message Authentication)

**Type**: TXT
**Name**: `_dmarc`
**Value**:
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@smokava.com; ruf=mailto:dmarc@smokava.com; fo=1
```

**DMARC Policy Options**:
- `p=none` - Monitor only (recommended for initial setup)
- `p=quarantine` - Quarantine suspicious emails
- `p=reject` - Reject suspicious emails (strictest)

**Recommended Initial Setup**:
```
v=DMARC1; p=none; rua=mailto:dmarc@smokava.com; pct=100
```

#### Complete DNS Records Summary

Add these TXT records to your DNS:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` | 3600 |
| TXT | `google._domainkey` | (From Google Admin Console) | 3600 |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@smokava.com; pct=100` | 3600 |

**Verification**:
```bash
# Check SPF
dig TXT smokava.com +short

# Check DKIM
dig TXT google._domainkey.smokava.com +short

# Check DMARC
dig TXT _dmarc.smokava.com +short
```

---

### 4. Title Verification

**Status**: ✅ Complete

The homepage title can be overridden using the environment variable `NEXT_PUBLIC_ENAMAD_TITLE_OVERRIDE`.

**Implementation**: Updated `/frontend/app/layout.tsx` to check for this environment variable.

**Usage**:
```bash
# In .env.local or production environment
NEXT_PUBLIC_ENAMAD_TITLE_OVERRIDE="Your Custom Title for eNAMAD"
```

**Verification**:
- Check page source: `<title>Your Custom Title for eNAMAD</title>`
- Or visit: `https://smokava.com` and inspect the title tag

---

### 5. Meta Tag Verification

**Status**: ✅ Complete

The eNAMAD meta tag can be added using the environment variable `NEXT_PUBLIC_ENAMAD_META_CODE`.

**Implementation**: Updated `/frontend/app/layout.tsx` to inject the meta tag when the environment variable is present.

**Usage**:
```bash
# In .env.local or production environment
NEXT_PUBLIC_ENAMAD_META_CODE="your-enamad-verification-code"
```

**Verification**:
- Check page source: `<meta name="enamad" content="your-enamad-verification-code">`
- Or visit: `https://smokava.com` and inspect the head section

---

### 6. Debug Page

**Status**: ✅ Complete

A debug page has been created at `/enamad-status` (development only).

**Features**:
- HTTPS status check
- File accessibility verification (`/28609673.txt`)
- Title override status
- Meta tag status
- Email DNS readiness info

**Access**: `http://localhost:3000/enamad-status` (development only)

**Note**: This page is automatically hidden in production mode.

---

### 7. Localhost References Removal

**Status**: ✅ Complete

All hardcoded localhost references have been removed from production code paths.

**Remaining localhost references** (acceptable):
- Nginx config: Uses `localhost` for Docker internal networking (correct)
- Development fallbacks: Only active in `NODE_ENV=development` mode
- Scripts: Development-only scripts use localhost (acceptable)

**Production Code**:
- ✅ `frontend/lib/api.ts` - Uses env var, localhost only in dev
- ✅ `admin-panel/src/lib/api.ts` - Uses env var, localhost only in dev
- ✅ `backend/server.js` - Uses env vars, localhost only in dev

---

## Required Environment Variables

Add these to your production environment (`.env` or environment configuration):

```bash
# eNAMAD Verification
NEXT_PUBLIC_ENAMAD_TITLE_OVERRIDE="Your Custom Title"
NEXT_PUBLIC_ENAMAD_META_CODE="your-enamad-verification-code"

# Existing Required Variables
NEXT_PUBLIC_API_URL=https://api.smokava.com/api
MONGODB_URI=mongodb://your-mongodb-uri
ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
```

---

## Server Configuration Changes

### Nginx Configuration Updates

**File**: `/nginx/smokava-docker.conf`

**Changes Made**:
1. Added location block for `/28609673.txt` with no-cache headers
2. Added location block for `/enamad/` folder
3. Ensured plain text content type
4. Disabled caching for verification files

**After SSL Setup**, uncomment and update the HTTPS redirect blocks.

---

## Verification Checklist

Before submitting to eNAMAD, verify:

- [ ] HTTPS is enabled and working (`https://smokava.com`)
- [ ] Verification file accessible: `https://smokava.com/28609673.txt` returns 200 OK
- [ ] No redirects on verification file (check with `curl -L`)
- [ ] Title override is set (if required by eNAMAD)
- [ ] Meta tag is present in homepage `<head>` (if required by eNAMAD)
- [ ] DNS records for email are added (SPF, DKIM, DMARC)
- [ ] Email `info@smokava.com` is configured and working
- [ ] No localhost references in production code
- [ ] All environment variables are set in production

---

## Testing Commands

```bash
# Test HTTPS
curl -I https://smokava.com

# Test verification file
curl -I https://smokava.com/28609673.txt
curl https://smokava.com/28609673.txt

# Test no redirects
curl -L -I https://smokava.com/28609673.txt

# Test DNS records
dig TXT smokava.com +short
dig TXT _dmarc.smokava.com +short
dig TXT google._domainkey.smokava.com +short

# Test meta tag (requires browser or HTML parser)
curl https://smokava.com | grep -i "enamad"
```

---

## Troubleshooting

### Verification File Not Accessible

1. Check nginx configuration is loaded: `sudo nginx -t`
2. Check file exists: `ls -la /path/to/frontend/public/28609673.txt`
3. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify no middleware is blocking the route

### HTTPS Not Working

1. Check certificate: `sudo certbot certificates`
2. Check nginx SSL config: `sudo nginx -t`
3. Check firewall: `sudo ufw status`
4. Verify DNS: `dig smokava.com`

### DNS Records Not Propagating

1. Wait 24-48 hours for full propagation
2. Check with multiple DNS tools: `dig`, `nslookup`, `mxtoolbox.com`
3. Verify TTL settings (lower TTL = faster updates)

---

## Support

For eNAMAD-specific issues, refer to:
- eNAMAD Official Documentation
- eNAMAD Support Portal

For technical issues with this setup, check:
- Nginx error logs: `/var/log/nginx/error.log`
- Application logs
- Docker container logs: `docker logs <container-name>`

---

**Last Updated**: 2024
**Version**: 1.0

