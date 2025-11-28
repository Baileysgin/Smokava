#!/bin/bash

# ===========================================
# SMOKAVA - SERVER SETUP SCRIPT
# ===========================================
# This script sets up the Ubuntu server for deployment
# Run this once on a fresh server

set -e

echo "🚀 Setting up Smokava server..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Install Git
echo "📦 Installing Git..."
sudo apt-get install -y git

# Install MongoDB (if not using external DB)
echo "📦 Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    sudo systemctl enable mongod
    sudo systemctl start mongod
fi

# Install Certbot for SSL
echo "📦 Installing Certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

# Create directories
echo "📁 Creating directories..."
sudo mkdir -p /opt/smokava
sudo mkdir -p /var/www/smokava-frontend
sudo mkdir -p /var/www/smokava-admin-panel
sudo mkdir -p /opt/smokava/logs

# Set permissions
sudo chown -R $USER:$USER /opt/smokava
sudo chown -R www-data:www-data /var/www/smokava-frontend
sudo chown -R www-data:www-data /var/www/smokava-admin-panel

# Setup PM2 startup
echo "⚙️  Configuring PM2 startup..."
pm2 startup systemd -u $USER --hp /home/$USER
pm2 save

echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Clone your repository to /opt/smokava"
echo "2. Copy env.example to backend/.env and configure it"
echo "3. Copy nginx/smokava.conf to /etc/nginx/sites-available/smokava"
echo "4. Create symlink: sudo ln -s /etc/nginx/sites-available/smokava /etc/nginx/sites-enabled/"
echo "5. Update domain names in nginx config"
echo "6. Run: sudo certbot --nginx -d your-domain.com"
echo "7. Start backend: pm2 start ecosystem.config.js"
