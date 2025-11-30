# Server Setup Guide

This guide covers setting up Smokava on a production server.

## Prerequisites

- Ubuntu/Debian server (or similar Linux distribution)
- Docker and Docker Compose installed
- Domain names configured (or use server IP)
- Root or sudo access

## Step 1: Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## Step 2: Clone Repository

```bash
cd /opt
sudo git clone https://github.com/Baileysgin/Smokava.git
cd Smokava
sudo chown -R $USER:$USER .
```

## Step 3: Configure Environment Variables

```bash
# Copy example env file
cp env.example .env

# Edit with your production values
nano .env
```

Required variables (see `DOCS/ENV.md` for complete list):

```bash
# Database
MONGODB_URI=mongodb://mongodb:27017/smokava
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smokava

# JWT Secret (generate strong secret)
JWT_SECRET=$(openssl rand -base64 32)

# URLs (use your actual domains)
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
API_BASE_URL=https://api.smokava.com
ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.smokava.com/api
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Admin Panel
VITE_API_URL=https://api.smokava.com/api

# Kavenegar (SMS service)
KAVENEGAR_API_KEY=your_api_key
KAVENEGAR_TEMPLATE=otp-v2

# Backup
BACKUP_PATH=/var/backups/smokava
RETENTION_DAYS=7
```

## Step 4: Set Up Backup Directory

```bash
sudo mkdir -p /var/backups/smokava
sudo chown -R $USER:$USER /var/backups/smokava
chmod +x scripts/db-backup.sh
```

## Step 5: Deploy Application

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## Step 6: Create Admin User

```bash
docker-compose exec backend node scripts/createAdmin.js admin yoursecurepassword
```

**Important**: Change the default password after first login!

## Step 7: Set Up Hourly Backups

```bash
# Add to crontab
crontab -e

# Add this line:
0 * * * * /opt/smokava/scripts/db-backup.sh >> /var/log/smokava-backup.log 2>&1
```

## Step 8: Configure Nginx (if using reverse proxy)

See `nginx/smokava.conf` for example Nginx configuration.

## Step 9: Set Up SSL Certificates

Use Let's Encrypt with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d smokava.com -d www.smokava.com -d admin.smokava.com -d api.smokava.com
```

## Step 10: Verify Deployment

```bash
# Check health endpoint
curl https://api.smokava.com/api/health

# Check services
docker-compose ps

# Check logs for errors
docker-compose logs backend | tail -50
```

## Access Your Application

- **Frontend**: `https://smokava.com`
- **Admin Panel**: `https://admin.smokava.com`
- **API**: `https://api.smokava.com/api`

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs admin-panel

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Check MongoDB container
docker-compose logs mongodb

# Verify connection
docker-compose exec backend node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(e => console.error(e));"
```

### Port Conflicts

If ports are already in use, modify `docker-compose.yml` to use different ports.

### Backup Issues

```bash
# Test backup manually
bash scripts/db-backup.sh

# Check backup directory
ls -lh /var/backups/smokava/
```

## Maintenance

### Update Application

```bash
cd /opt/smokava
git pull origin main
bash scripts/deploy.sh
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Restart Services

```bash
docker-compose restart
# Or restart specific service
docker-compose restart backend
```

## Security Checklist

- [ ] Strong JWT_SECRET set
- [ ] HTTPS enabled for all domains
- [ ] MongoDB secured (use MongoDB Atlas or secure local instance)
- [ ] Admin password changed from default
- [ ] Firewall configured (only allow necessary ports)
- [ ] Regular backups running
- [ ] Environment variables not exposed in git
- [ ] CORS origins properly configured

## Next Steps

- Configure monitoring and alerts
- Set up log rotation
- Configure automatic updates (optional)
- Review `DOCS/DEPLOY.md` for advanced deployment options
