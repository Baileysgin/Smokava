# Deployment Guide

This guide explains how to deploy the Smokava project to a remote server.

## Prerequisites

- Remote server with SSH access
- Server should have at least 2GB RAM and 20GB disk space
- Ports 22 (SSH), 3000 (Frontend), 5000 (Backend), 5173 (Admin Panel), 27017 (MongoDB) should be open

## Quick Deployment

### Option 1: Automated Deployment Script

1. Make the deployment script executable:
```bash
chmod +x deploy.sh
```

2. Run the deployment script:
```bash
./deploy.sh
```

The script will:
- Package your project (excluding node_modules, .git, etc.)
- Upload it to the server
- Install Docker and Docker Compose if needed
- Build and start all containers
- Set up environment variables

### Option 2: Manual Deployment

#### Step 1: Prepare Environment Variables

Create a `.env` file in the project root:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
KAVENEGAR_API_KEY=your-kavenegar-api-key-here
KAVENEGAR_TEMPLATE=your-template-name-here
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
ALLOWED_ORIGINS=http://YOUR_SERVER_IP:3000,http://YOUR_SERVER_IP:5173
```

#### Step 2: Upload Project to Server

```bash
# Create a deployment package
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='*.log' \
    -czf smokava-deploy.tar.gz .

# Upload to server
scp -P 22 smokava-deploy.tar.gz root@91.107.241.245:/opt/smokava/
```

#### Step 3: SSH into Server and Deploy

```bash
ssh -p 22 root@91.107.241.245

# On the server:
cd /opt/smokava
tar -xzf smokava-deploy.tar.gz
chmod +x deploy-server.sh
./deploy-server.sh
```

## Server Configuration

### Firewall Setup

Make sure these ports are open:

```bash
# Ubuntu/Debian
ufw allow 22/tcp
ufw allow 3000/tcp
ufw allow 5000/tcp
ufw allow 5173/tcp
ufw enable

# CentOS/RHEL
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=5000/tcp
firewall-cmd --permanent --add-port=5173/tcp
firewall-cmd --reload
```

### Update Environment Variables

After deployment, update the `.env` file on the server:

```bash
ssh -p 22 root@91.107.241.245
cd /opt/smokava
nano .env
# Update with your actual values
docker-compose restart
```

## Post-Deployment

### Check Service Status

```bash
ssh -p 22 root@91.107.241.245
cd /opt/smokava
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f admin-panel
```

### Restart Services

```bash
docker-compose restart
# Or restart specific service
docker-compose restart backend
```

### Update Deployment

```bash
# On your local machine
./deploy.sh

# Or manually:
# 1. Make changes locally
# 2. Run deploy.sh again
# 3. On server, run: docker-compose up -d --build
```

## Production Considerations

### 1. Use a Reverse Proxy (Nginx)

For production, set up Nginx as a reverse proxy:

```nginx
# /etc/nginx/sites-available/smokava
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /admin {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 2. SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. MongoDB Security

For production, secure MongoDB:

```bash
# On server
docker-compose exec mongodb mongosh smokava

# In MongoDB shell:
use admin
db.createUser({
  user: "admin",
  pwd: "strong-password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})
```

Then update `MONGODB_URI` in `.env`:
```
MONGODB_URI=mongodb://admin:strong-password@mongodb:27017/smokava?authSource=admin
```

### 4. Backup Strategy

Set up automated backups:

```bash
# Create backup script
cat > /opt/smokava/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/smokava/backups"
mkdir -p $BACKUP_DIR
docker-compose exec -T mongodb mongodump --archive > $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).archive
# Keep only last 7 days
find $BACKUP_DIR -name "backup-*.archive" -mtime +7 -delete
EOF

chmod +x /opt/smokava/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/smokava/backup.sh
```

## Troubleshooting

### Containers won't start

```bash
docker-compose logs
docker-compose ps
```

### Port already in use

```bash
# Check what's using the port
netstat -tulpn | grep :3000
# Kill the process or change port in docker-compose.yml
```

### MongoDB connection issues

```bash
# Check MongoDB container
docker-compose logs mongodb
docker-compose exec mongodb mongosh smokava
```

### Out of disk space

```bash
# Clean up Docker
docker system prune -a
docker volume prune
```

### Update Docker images

```bash
docker-compose pull
docker-compose up -d --build
```

## Monitoring

### Resource Usage

```bash
docker stats
```

### Service Health

```bash
# Check if services are responding
curl http://localhost:5000
curl http://localhost:3000
curl http://localhost:5173
```

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong MongoDB password
- [ ] Set up firewall rules
- [ ] Use HTTPS (SSL certificate)
- [ ] Set up reverse proxy
- [ ] Enable MongoDB authentication
- [ ] Set up automated backups
- [ ] Configure CORS properly
- [ ] Use environment variables (never commit secrets)
- [ ] Keep Docker images updated
