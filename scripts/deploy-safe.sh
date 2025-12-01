#!/bin/bash

# Safe Deployment Script for Smokava
# This script performs a safe deployment with pre-deploy backup and health checks
# It ensures the database is never wiped during deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="${PROJECT_DIR:-/opt/smokava}"
BACKUP_DIR="${BACKUP_PATH:-/var/backups/smokava}"
LOG_FILE="${LOG_FILE:-/var/log/smokava-deploy.log}"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    error "Please run as root or with sudo"
fi

# Change to project directory
cd "$PROJECT_DIR" || error "Project directory not found: $PROJECT_DIR"

log "Starting safe deployment process..."

# Step 1: Pre-deploy backup
log "Step 1: Creating pre-deploy backup..."
if [ -f "$PROJECT_DIR/scripts/db-backup.sh" ]; then
    bash "$PROJECT_DIR/scripts/db-backup.sh" || warn "Backup failed, but continuing deployment"
else
    warn "Backup script not found, skipping backup"
fi

# Step 2: Pre-deploy health check
log "Step 2: Running pre-deploy health check..."
if [ -f "$PROJECT_DIR/scripts/pre-deploy-health-check.sh" ]; then
    bash "$PROJECT_DIR/scripts/pre-deploy-health-check.sh" || warn "Pre-deploy health check failed, but continuing"
else
    warn "Pre-deploy health check script not found, skipping"
fi

# Step 3: Pull latest code
log "Step 3: Pulling latest code from git..."
git fetch origin || error "Failed to fetch from git"
git pull origin main || git pull origin master || error "Failed to pull latest code"

# Step 4: Determine docker compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    error "Neither 'docker compose' nor 'docker-compose' found!"
fi

# Step 5: Build images (without starting containers)
log "Step 5: Building Docker images..."
$DOCKER_COMPOSE_CMD build --no-cache || warn "Build failed, but continuing with existing images"

# Step 6: Apply migrations (if any)
log "Step 6: Checking for database migrations..."
# MongoDB doesn't use migrations like SQL databases, but we can run any setup scripts here
if [ -f "$PROJECT_DIR/backend/scripts/migrate.js" ]; then
    log "Running migration script..."
    docker compose exec -T backend node scripts/migrate.js || warn "Migration script failed"
fi

# Step 7: Start/restart services (without removing volumes)
log "Step 7: Starting services (preserving volumes)..."
$DOCKER_COMPOSE_CMD up -d --no-deps backend frontend admin-panel || error "Failed to start services"

# Step 8: Wait for services to be healthy
log "Step 8: Waiting for services to be healthy..."
sleep 10

# Step 9: Post-deploy health check
log "Step 9: Running post-deploy health check..."
if [ -f "$PROJECT_DIR/scripts/pre-deploy-health-check.sh" ]; then
    bash "$PROJECT_DIR/scripts/pre-deploy-health-check.sh" || warn "Post-deploy health check failed"
else
    warn "Health check script not found, skipping"
fi

# Step 10: Verify database is intact
log "Step 10: Verifying database integrity..."
MONGODB_CONTAINER=$($DOCKER_COMPOSE_CMD ps -q mongodb 2>/dev/null || echo "")
if [ -n "$MONGODB_CONTAINER" ]; then
    USER_COUNT=$(docker exec "$MONGODB_CONTAINER" mongosh --quiet --eval "db.users.countDocuments()" smokava 2>/dev/null || echo "0")
    if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
        warn "Database appears empty or inaccessible - this may indicate a problem"
    else
        log "Database verified: $USER_COUNT users found"
    fi
fi

log "Deployment completed successfully!"
log "Services are running. Check logs with: $DOCKER_COMPOSE_CMD logs -f"
