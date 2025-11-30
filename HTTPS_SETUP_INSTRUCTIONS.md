# HTTPS Setup Instructions for Smokava

This guide will help you enable HTTPS using Let's Encrypt certificates for all domains.

## Prerequisites

- Domain names pointing to your server:
  - `smokava.com` and `www.smokava.com`
  - `api.smokava.com`
  - `admin.smokava.com`
- Ports 80 and 443 open in your firewall
- Root or sudo access to the server
- Nginx installed and running

## Step 1: Install Certbot

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### CentOS/RHEL
```bash
sudo yum install certbot python3-certbot-nginx
```

## Step 2: Prepare Nginx for Certbot

Before running certbot, ensure your nginx config allows Let's Encrypt verification. The config has been updated to include:

```nginx
location /.well-known/acme-challenge/ {
    root /var/www/certbot;
}
```

Create the directory if it doesn't exist:
```bash
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
```

## Step 3: Obtain SSL Certificates

### Option A: Obtain certificates for all domains at once (Recommended)

```bash
sudo certbot certonly --nginx \
  -d smokava.com \
  -d www.smokava.com \
  -d api.smokava.com \
  -d admin.smokava.com
```

### Option B: Obtain certificates separately

```bash
# Main domain
sudo certbot certonly --nginx -d smokava.com -d www.smokava.com

# API subdomain
sudo certbot certonly --nginx -d api.smokava.com

# Admin subdomain
sudo certbot certonly --nginx -d admin.smokava.com
```

**Note**: Certbot will ask for:
- Email address (for renewal notifications)
- Agreement to terms of service
- Whether to share email with EFF (optional)

## Step 4: Update Nginx Configuration

The nginx configuration file (`nginx/smokava-docker.conf`) has already been updated with HTTPS support. You just need to:

1. **Copy the config to your server** (if using Docker, mount it properly)
2. **Verify certificate paths match** - Certbot typically stores certificates at:
   - `/etc/letsencrypt/live/smokava.com/` (for main domain)
   - `/etc/letsencrypt/live/api.smokava.com/` (for API)
   - `/etc/letsencrypt/live/admin.smokava.com/` (for admin)

3. **If using Docker**, ensure certificates are mounted:
   ```yaml
   volumes:
     - /etc/letsencrypt:/etc/letsencrypt:ro
     - ./nginx/smokava-docker.conf:/etc/nginx/conf.d/default.conf:ro
   ```

## Step 5: Test Nginx Configuration

```bash
sudo nginx -t
```

If the test passes, reload nginx:
```bash
sudo systemctl reload nginx
# Or if using Docker:
docker-compose restart nginx
```

## Step 6: Verify HTTPS is Working

Test each domain:

```bash
# Main domain
curl -I https://smokava.com

# API
curl -I https://api.smokava.com

# Admin
curl -I https://admin.smokava.com

# Verification file
curl -I https://smokava.com/28609673.txt
```

All should return `200 OK` with HTTPS.

## Step 7: Set Up Auto-Renewal

Certbot automatically sets up a systemd timer for renewal. Verify it's active:

```bash
sudo systemctl status certbot.timer
```

Test renewal (dry run):
```bash
sudo certbot renew --dry-run
```

Certificates are valid for 90 days and will auto-renew when they have 30 days remaining.

## Docker-Specific Setup

If you're using Docker, you have two options:

### Option 1: Certbot on Host, Certificates Mounted

1. Run certbot on the host (not in container)
2. Mount certificates into nginx container:
   ```yaml
   volumes:
     - /etc/letsencrypt:/etc/letsencrypt:ro
   ```

### Option 2: Certbot in Docker Container

Use a certbot container to obtain certificates, then share them with nginx container.

Example docker-compose addition:
```yaml
certbot:
  image: certbot/certbot
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt
    - /var/www/certbot:/var/www/certbot
  command: certonly --webroot -w /var/www/certbot -d smokava.com -d www.smokava.com --email your@email.com --agree-tos --non-interactive
```

## Troubleshooting

### Certificate Not Found Error

If nginx can't find certificates:
1. Check certificate paths in nginx config match actual locations
2. Verify certificates exist: `sudo ls -la /etc/letsencrypt/live/`
3. Check file permissions: `sudo chmod 644 /etc/letsencrypt/live/*/fullchain.pem`

### Port 80/443 Not Accessible

```bash
# Check if ports are open
sudo netstat -tlnp | grep -E ':(80|443)'

# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Nginx Configuration Errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Certificate Renewal Issues

```bash
# Check renewal status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

## Security Best Practices

1. **HSTS Header**: Already configured in nginx (`Strict-Transport-Security`)
2. **Strong Ciphers**: Modern TLS 1.2/1.3 only
3. **OCSP Stapling**: Consider adding for better performance
4. **Certificate Monitoring**: Set up alerts for renewal failures

## Verification Checklist

- [ ] Certbot installed
- [ ] Certificates obtained for all domains
- [ ] Nginx config updated and tested
- [ ] HTTPS working on all domains
- [ ] HTTP redirects to HTTPS
- [ ] Verification file accessible via HTTPS
- [ ] Auto-renewal configured and tested
- [ ] Firewall allows ports 80 and 443

## Next Steps

After HTTPS is enabled:
1. Update environment variables to use HTTPS URLs
2. Test all API endpoints
3. Verify eNAMAD verification file is accessible
4. Update CORS settings if needed
5. Test certificate auto-renewal

---

**Last Updated**: 2024
**Status**: Ready for implementation



