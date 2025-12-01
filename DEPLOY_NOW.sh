#!/bin/bash

# Quick Deployment Script - Copy and paste this on your production server
# Or run: bash <(curl -s https://raw.githubusercontent.com/Baileysgin/Smokava/main/DEPLOY_NOW.sh)

set -e

echo "🚀 Smokava Production Deployment"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  Please run with sudo"
    exit 1
fi

PROJECT_DIR="/opt/smokava"
cd "$PROJECT_DIR" || {
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
}

echo "📦 Step 1: Pulling latest code..."
git pull origin main || {
    echo "❌ Failed to pull code"
    exit 1
}

echo ""
echo "💾 Step 2: Creating backup..."
if [ -f "$PROJECT_DIR/scripts/db-backup.sh" ]; then
    bash "$PROJECT_DIR/scripts/db-backup.sh" || echo "⚠️  Backup failed, but continuing..."
else
    echo "⚠️  Backup script not found, skipping backup"
fi

echo ""
echo "⏰ Step 3: Setting up hourly backups..."
if [ -f "$PROJECT_DIR/scripts/setup-hourly-backup.sh" ]; then
    bash "$PROJECT_DIR/scripts/setup-hourly-backup.sh" || echo "⚠️  Backup setup failed, but continuing..."
else
    echo "⚠️  Backup setup script not found, skipping"
fi

echo ""
echo "🔧 Step 4: Building and deploying..."
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "❌ Docker Compose not found!"
    exit 1
fi

# Build images
echo "Building Docker images..."
$DOCKER_COMPOSE_CMD build --no-cache || echo "⚠️  Build failed, using existing images"

# Start services (preserves volumes)
echo "Starting services..."
$DOCKER_COMPOSE_CMD up -d --no-deps --build backend frontend admin-panel || {
    echo "❌ Failed to start services"
    exit 1
}

echo ""
echo "⏳ Step 5: Waiting for services to start..."
sleep 10

echo ""
echo "✅ Step 6: Verifying deployment..."
$DOCKER_COMPOSE_CMD ps

echo ""
echo "🏥 Health check..."
curl -s http://localhost:5001/api/health | head -5 || echo "⚠️  Health check failed"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "  • Check services: docker compose ps"
echo "  • Check logs: docker compose logs -f"
echo "  • Verify backups: ls -lh /var/backups/smokava/"

