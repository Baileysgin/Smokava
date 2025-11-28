# HTTPS Deployment Guide for Smokava

This guide explains how to enable HTTPS on your production server.

## Quick Start

### Option 1: Automated Setup (Recommended)

1. **Deploy the updated code to your server** (includes HTTPS nginx config):
   ```bash
   ./deploy.sh
   ```

2. **SSH into your server**:
   ```bash
   ssh root@91.107.241.245
   # Or use your SSH key if configured
   ```

3. **Navigate to deployment directory**:
   ```bash
   cd /opt/smokava
   ```

4. **Run the HTTPS setup script**:
   ```bash
   sudo ./scripts/setup-https-server.sh
   ```

The script will:
- Install Certbot
- Obtain SSL certificates
- Configure auto-renewal
- Test HTTPS endpoints

### Option 2: Manual Setup

If you prefer to do it manually:

1. **SSH into your server**:
   ```bash
   ssh root@91.107.241.245
   cd /opt/smokava
   ```

2. **Install Certbot**:
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   ```

3. **Obtain certificates**:
   ```bash
   sudo certbot --nginx \
     -d smokava.com \
     -d www.smokava.com \
     -d api.smokava.com \
     -d admin.smokava.com
   ```

4. **Test nginx configuration**:
   ```bash
   sudo nginx -t
   ```

5. **Reload nginx**:
   ```bash
   sudo systemctl reload nginx
   # Or if using Docker:
   docker-compose restart nginx
   ```

## Docker-Specific Setup

If you're using Docker Compose, you need to:

### 1. Mount SSL Certificates

Update your `docker-compose.yml` to include nginx service with mounted certificates:

```yaml
nginx:
  image: nginx:alpine
  container_name: smokava-nginx
  restart: unless-stopped
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/smokava-docker.conf:/etc/nginx/conf.d/default.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
    - /var/www/certbot:/var/www/certbot:ro
  depends_on:
    - frontend
    - backend
    - admin-panel
  networks:
    - smokava-network
```

### 2. Update docker-compose.yml

Add nginx service to your existing `docker-compose.yml`:

```yaml
services:
  # ... existing services ...

  nginx:
    image: nginx:alpine
    container_name: smokava-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/smokava-docker.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
    depends_on:
      - frontend
      - backend
      - admin-panel
    networks:
      - smokava-network
```

### 3. Remove Port Exposures from Other Services

Since nginx will proxy to them, you can remove port mappings:

```yaml
frontend:
  # Remove: ports: - "3000:3000"
  expose:
    - "3000"

backend:
  # Remove: ports: - "5000:5000"
  expose:
    - "5000"

admin-panel:
  # Remove: ports: - "5173:80"
  expose:
    - "80"
```

## Verification

After setup, verify HTTPS is working:

```bash
# Test main domain
curl -I https://smokava.com

# Test API
curl -I https://api.smokava.com

# Test admin panel
curl -I https://admin.smokava.com

# Test verification file
curl -I https://smokava.com/28609673.txt
```

All should return `200 OK` or `301/302` redirects.

## Troubleshooting

### Certificate Not Found

If nginx can't find certificates:
```bash
# Check if certificates exist
sudo ls -la /etc/letsencrypt/live/

# Verify paths in nginx config match
sudo grep ssl_certificate /etc/nginx/conf.d/default.conf
```

### Port Already in Use

If port 80 or 443 is already in use:
```bash
# Check what's using the ports
sudo netstat -tlnp | grep -E ':(80|443)'

# Stop conflicting service or change nginx ports
```

### Nginx Configuration Errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# If using Docker
docker logs smokava-nginx
```

### Domain Not Pointing to Server

Verify DNS:
```bash
# Check A records
dig +short smokava.com
dig +short api.smokava.com
dig +short admin.smokava.com

# All should return your server IP: 91.107.241.245
```

## Post-Deployment Checklist

- [ ] HTTPS working on all domains
- [ ] HTTP redirects to HTTPS
- [ ] Verification file accessible: `https://smokava.com/28609673.txt`
- [ ] Auto-renewal configured and tested
- [ ] Environment variables updated to use HTTPS URLs
- [ ] CORS settings updated if needed
- [ ] All API endpoints working over HTTPS

## Environment Variables Update

After HTTPS is enabled, update your environment variables:

```bash
# In .env or docker-compose.yml
NEXT_PUBLIC_API_URL=https://api.smokava.com/api
VITE_API_URL=https://api.smokava.com/api
ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
```

## Support

For detailed instructions, see:
- `HTTPS_SETUP_INSTRUCTIONS.md` - Complete setup guide
- `ENAMAD_VERIFICATION_SETUP.md` - eNAMAD-specific requirements

---

**Last Updated**: 2024
