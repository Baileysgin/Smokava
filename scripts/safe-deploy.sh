#!/bin/bash

# ===========================================
# SAFE DEPLOYMENT SCRIPT
# ===========================================
# Safe deployment script that preserves database volumes
# Designed for production use with Docker Compose
# NEVER uses docker compose down -v

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="${PROJECT_DIR:-/opt/smokava}"
BACKUP_DIR="${BACKUP_PATH:-/var/backups/smokava}"
LOG_FILE="${LOG_FILE:-/var/log/smokava-deploy.log}"

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SAFE DEPLOYMENT PROCESS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    error "Please run as root or with sudo"
fi

# Change to project directory
cd "$PROJECT_DIR" || error "Project directory not found: $PROJECT_DIR"
log "Working directory: $PROJECT_DIR"

# Step 1: Create backup
log "Step 1: Creating database backup..."
if [ -f "$PROJECT_DIR/scripts/db-backup.sh" ]; then
    bash "$PROJECT_DIR/scripts/db-backup.sh" || warn "Backup failed, but continuing deployment"
else
    warn "Backup script not found, skipping backup"
fi

# Step 2: Determine docker compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    error "Neither 'docker compose' nor 'docker-compose' found!"
fi

log "Using: $DOCKER_COMPOSE_CMD"

# Step 3: Verify database volume exists
log "Step 2: Verifying database volumes..."
VOLUMES=("smokava_mongodb_data" "smokava_admin_data")

for VOLUME in "${VOLUMES[@]}"; do
    if docker volume ls | grep -q "$VOLUME"; then
        log "✅ Volume exists: $VOLUME"
    else
        warn "⚠️  Volume not found: $VOLUME (will be created if needed)"
    fi
done

# Step 4: Pull latest code (if in git repo)
log "Step 3: Pulling latest code..."
if [ -d ".git" ]; then
    git fetch origin || warn "Failed to fetch from git"
    git pull origin main || git pull origin master || warn "Failed to pull latest code"
    log "✅ Code updated"
else
    warn "Not a git repository, skipping code pull"
fi

# Step 5: Verify .env file exists
log "Step 4: Checking environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        warn ".env file not found, copying from env.example"
        cp env.example .env
        warn "⚠️  Please update .env file with production values!"
    else
        warn "⚠️  .env file not found and no env.example available"
    fi
fi

# Validate critical environment variables
log "Step 5: Validating environment variables..."
if [ -f ".env" ]; then
    source .env 2>/dev/null || true

    # Check critical variables
    MISSING_VARS=()
    [ -z "$MONGODB_URI" ] && MISSING_VARS+=("MONGODB_URI")
    [ -z "$JWT_SECRET" ] && MISSING_VARS+=("JWT_SECRET")
    [ -z "$API_BASE_URL" ] && MISSING_VARS+=("API_BASE_URL")

    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        warn "⚠️  Missing critical environment variables: ${MISSING_VARS[*]}"
        warn "⚠️  Services may fail to start. Please check .env file."
    else
        log "✅ Critical environment variables are set"
    fi
fi

# Step 6: Build images with continuous output
log "Step 6: Building Docker images (this may take several minutes)..."
log "💡 Tip: This step outputs continuously to keep SSH connection alive"
$DOCKER_COMPOSE_CMD build --no-cache 2>&1 | while IFS= read -r line; do
    echo "$line"
done || {
    warn "Build failed, checking if existing images can be used..."
    if docker images | grep -q "smokava-backend\|smokava-frontend\|smokava-admin-panel"; then
        warn "⚠️  Using existing images. If issues occur, rebuild manually."
    else
        error "Build failed and no existing images found. Cannot continue."
    fi
}

# Step 7: CRITICAL SAFETY CHECK - Prevent volume deletion
log "Step 6: Safety check - preventing volume deletion..."
if echo "$*" | grep -q "down.*-v\|-v.*down"; then
    error "CRITICAL: docker compose down -v detected! This would DELETE the database. Deployment aborted for safety."
fi

# Step 8: Stop containers gracefully (preserving volumes)
log "Step 7: Stopping containers (preserving volumes)..."
$DOCKER_COMPOSE_CMD stop backend frontend admin-panel mongodb 2>/dev/null || warn "Some containers may not have been running"

# Step 9: Remove containers (NOT volumes!)
log "Step 8: Removing containers (preserving volumes)..."
$DOCKER_COMPOSE_CMD rm -f backend frontend admin-panel 2>/dev/null || warn "Some containers may not exist"

# Also remove by container name if they exist (handles orphaned containers)
log "Removing any orphaned containers..."
docker rm -f smokava-backend smokava-frontend smokava-admin-panel 2>/dev/null || true

# Step 10: Start services (preserving volumes)
log "Step 9: Starting services (preserving volumes)..."
log "💡 Starting MongoDB first, then dependent services..."

# Start MongoDB first and wait for it
$DOCKER_COMPOSE_CMD up -d mongodb || error "Failed to start MongoDB"
log "Waiting for MongoDB to be ready..."
for i in {1..60}; do
    if docker exec smokava-mongodb mongosh --quiet --eval "db.runCommand('ping').ok" smokava 2>/dev/null | grep -q "1"; then
        log "✅ MongoDB is ready"
        break
    fi
    if [ $i -eq 60 ]; then
        warn "⚠️  MongoDB did not become ready in 60 seconds"
    else
        sleep 1
        echo -n "."
    fi
done
echo ""

# Start other services
log "Starting backend, frontend, and admin-panel..."
$DOCKER_COMPOSE_CMD up -d --build backend frontend admin-panel || error "Failed to start services"

# Step 11: Wait for services to be healthy
log "Step 10: Waiting for services to start (with retries)..."
sleep 10

# Check container status with retries
MAX_RETRIES=5
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    log "Checking container status (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
    $DOCKER_COMPOSE_CMD ps

    # Check if all containers are running
    STOPPED_CONTAINERS=$($DOCKER_COMPOSE_CMD ps --format json 2>/dev/null | grep -c '"State":"exited"' || echo "0")
    if [ "$STOPPED_CONTAINERS" -eq "0" ]; then
        log "✅ All containers are running"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            warn "⚠️  Some containers are not running. Retrying in 10 seconds..."
            sleep 10
            # Try to restart stopped containers
            $DOCKER_COMPOSE_CMD up -d backend frontend admin-panel 2>/dev/null || true
        else
            warn "⚠️  Some containers failed to start after $MAX_RETRIES attempts"
            log "Checking logs for failed containers..."
            $DOCKER_COMPOSE_CMD ps --format "table {{.Name}}\t{{.Status}}"
            $DOCKER_COMPOSE_CMD logs --tail 20 backend frontend admin-panel 2>&1 | tail -30
        fi
    fi
done

# Step 12: Verify database is intact
log "Step 11: Verifying database integrity..."
MONGODB_CONTAINER=$($DOCKER_COMPOSE_CMD ps -q mongodb 2>/dev/null || echo "")
if [ -n "$MONGODB_CONTAINER" ]; then
    # Wait for MongoDB to be ready
    for i in {1..30}; do
        if docker exec "$MONGODB_CONTAINER" mongosh --quiet --eval "db.runCommand('ping').ok" smokava 2>/dev/null | grep -q "1"; then
            log "✅ MongoDB is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            warn "⚠️  MongoDB may not be ready yet"
        else
            sleep 1
        fi
    done

    USER_COUNT=$(docker exec "$MONGODB_CONTAINER" mongosh --quiet --eval "db.users.countDocuments()" smokava 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")
    if [ "$USER_COUNT" != "0" ] && [ -n "$USER_COUNT" ]; then
        log "✅ Database verified: $USER_COUNT users found"
    else
        warn "⚠️  Database appears empty or inaccessible - this may indicate a problem"
    fi
else
    warn "⚠️  MongoDB container not found"
fi

# Step 13: Reload Nginx
log "Step 12: Reloading Nginx..."
if command -v nginx >/dev/null 2>&1; then
    if nginx -t >/dev/null 2>&1; then
        systemctl reload nginx || warn "Failed to reload Nginx"
        log "✅ Nginx reloaded"
    else
        warn "⚠️  Nginx configuration has errors, skipping reload"
    fi
else
    warn "⚠️  Nginx not found, skipping reload"
fi

# Step 14: Health check with retries
log "Step 13: Running health checks (with retries)..."
sleep 5

# Function to check service with retries
check_service() {
    local name=$1
    local url=$2
    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s --max-time 10 "$url" >/dev/null 2>&1; then
            log "✅ $name is healthy"
            return 0
        fi
        if [ $attempt -lt $max_attempts ]; then
            echo "   Attempt $attempt/$max_attempts failed, retrying in 3 seconds..."
            sleep 3
        fi
        attempt=$((attempt + 1))
    done

    warn "⚠️  $name health check failed after $max_attempts attempts"
    return 1
}

# Check API health
check_service "Backend API" "http://localhost:5000/api/health"

# Check frontend
check_service "Frontend" "http://localhost:3000"

# Check admin panel
check_service "Admin Panel" "http://localhost:5173"

# Final container status check
log "Final container status:"
$DOCKER_COMPOSE_CMD ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Check for restarting containers
RESTARTING=$($DOCKER_COMPOSE_CMD ps --format json 2>/dev/null | grep -c '"State":"restarting"' || echo "0")
if [ "$RESTARTING" -gt "0" ]; then
    warn "⚠️  $RESTARTING container(s) are in restart loop. Check logs:"
    $DOCKER_COMPOSE_CMD logs --tail 30 backend frontend admin-panel 2>&1 | grep -i "error\|fatal\|exception" | tail -10 || true
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
log "Services are running. Check logs with: $DOCKER_COMPOSE_CMD logs -f"
log "View status: $DOCKER_COMPOSE_CMD ps"
echo ""
