#!/bin/bash

# Server-side deployment script
# This script runs on the remote server

set -e

echo "🔧 Setting up Smokava on server..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    echo "📦 Docker Compose plugin not found, installing standalone version..."
    # Install standalone docker-compose
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    DOCKER_COMPOSE_CMD="docker-compose"
else
    DOCKER_COMPOSE_CMD="docker compose"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Backend Environment Variables
JWT_SECRET=$(openssl rand -base64 32)
KAVENEGAR_API_KEY=your-kavenegar-api-key-here
KAVENEGAR_TEMPLATE=your-template-name-here

# Frontend Environment Variables
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# CORS Configuration - Update with your domain
ALLOWED_ORIGINS=http://$(hostname -I | awk '{print $1}'):3000,http://$(hostname -I | awk '{print $1}'):5173
EOF
    echo "⚠️  Please update .env file with your actual values!"
fi

# Update docker-compose.yml to use server IP for API URLs
SERVER_IP=$(hostname -I | awk '{print $1}')

# Update frontend API URL in docker-compose.yml
sed -i "s|NEXT_PUBLIC_API_URL=http://localhost:5000/api|NEXT_PUBLIC_API_URL=http://$SERVER_IP:5000/api|g" docker-compose.yml || true

# Update admin panel API URL
sed -i "s|VITE_API_URL=http://localhost:5000/api|VITE_API_URL=http://$SERVER_IP:5000/api|g" docker-compose.yml || true

# Update ALLOWED_ORIGINS in docker-compose.yml
sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=\${ALLOWED_ORIGINS:-http://$SERVER_IP:3000,http://$SERVER_IP:5173}|g" docker-compose.yml || true

echo "🐳 Building and starting Docker containers..."

# Stop existing containers if any
$DOCKER_COMPOSE_CMD down 2>/dev/null || true

# Build and start containers
$DOCKER_COMPOSE_CMD up -d --build

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check container status
echo ""
echo "📊 Container Status:"
$DOCKER_COMPOSE_CMD ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Services are available at:"
echo "   - Frontend: http://$SERVER_IP:3000"
echo "   - Backend API: http://$SERVER_IP:5000"
echo "   - Admin Panel: http://$SERVER_IP:5173"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: $DOCKER_COMPOSE_CMD logs -f"
echo "   - Restart services: $DOCKER_COMPOSE_CMD restart"
echo "   - Stop services: $DOCKER_COMPOSE_CMD down"
echo "   - Update services: $DOCKER_COMPOSE_CMD up -d --build"
