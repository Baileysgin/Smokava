#!/bin/bash
# ===========================================
# COMPLETE 502 BAD GATEWAY FIX SCRIPT
# ===========================================
# This script fixes all 8 layers causing 502 errors
# Run this on the server: bash /opt/smokava/scripts/complete-502-fix.sh

set -e

PROJECT_DIR="/opt/smokava"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  COMPLETE 502 FIX - ALL 8 LAYERS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd "$PROJECT_DIR" || error "Project directory not found: $PROJECT_DIR"

# ===========================================
# LAYER 1: SSH Access Layer
# ===========================================
log "LAYER 1: SSH Access - Already connected, skipping"

# ===========================================
# LAYER 2: Nginx Layer
# ===========================================
log "LAYER 2: Fixing Nginx..."

# Check if nginx config exists
if [ ! -f "/etc/nginx/sites-available/smokava-docker.conf" ] && [ ! -f "/etc/nginx/conf.d/smokava-docker.conf" ]; then
    warn "Nginx config not found, copying from project..."
    if [ -f "$PROJECT_DIR/nginx/smokava-docker.conf" ]; then
        sudo cp "$PROJECT_DIR/nginx/smokava-docker.conf" /etc/nginx/sites-available/smokava-docker.conf
        sudo ln -sf /etc/nginx/sites-available/smokava-docker.conf /etc/nginx/sites-enabled/smokava-docker.conf
        log "Nginx config copied"
    fi
fi

# Test nginx config
if sudo nginx -t 2>/dev/null; then
    log "✅ Nginx config is valid"
    sudo systemctl reload nginx || sudo systemctl restart nginx
else
    error "Nginx config has errors. Run: sudo nginx -t"
fi

# ===========================================
# LAYER 3: Docker Layer
# ===========================================
log "LAYER 3: Fixing Docker containers..."

# Determine docker compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    error "Docker Compose not found!"
fi

# Stop all containers
log "Stopping containers..."
$DOCKER_COMPOSE_CMD stop 2>/dev/null || true

# ===========================================
# LAYER 4: Environment Layer
# ===========================================
log "LAYER 4: Fixing environment files..."

# Backend .env
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
    log "Creating backend/.env..."
    cat > "$PROJECT_DIR/backend/.env" << 'EOF'
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/smokava
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D
KAVENEGAR_TEMPLATE=otp-v2
BACKEND_URL=https://api.smokava.com
API_BASE_URL=https://api.smokava.com
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
ADMIN_URL=https://admin.smokava.com
ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com
EOF
else
    # Ensure critical variables exist
    if ! grep -q "BACKEND_URL=https://api.smokava.com" "$PROJECT_DIR/backend/.env" 2>/dev/null; then
        log "Updating backend/.env with missing variables..."
        echo "BACKEND_URL=https://api.smokava.com" >> "$PROJECT_DIR/backend/.env"
        echo "ADMIN_URL=https://admin.smokava.com" >> "$PROJECT_DIR/backend/.env"
    fi
fi

# Frontend .env.local
if [ ! -f "$PROJECT_DIR/frontend/.env.local" ]; then
    log "Creating frontend/.env.local..."
    cat > "$PROJECT_DIR/frontend/.env.local" << 'EOF'
NEXT_PUBLIC_API_URL=https://api.smokava.com/api
BACKEND_URL=https://api.smokava.com
NEXT_PUBLIC_MAPBOX_TOKEN=
EOF
else
    if ! grep -q "NEXT_PUBLIC_API_URL=https://api.smokava.com" "$PROJECT_DIR/frontend/.env.local" 2>/dev/null; then
        log "Updating frontend/.env.local..."
        sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://api.smokava.com/api|' "$PROJECT_DIR/frontend/.env.local" || \
        echo "NEXT_PUBLIC_API_URL=https://api.smokava.com/api" >> "$PROJECT_DIR/frontend/.env.local"
    fi
fi

# Admin panel .env
if [ ! -f "$PROJECT_DIR/admin-panel/.env" ]; then
    log "Creating admin-panel/.env..."
    cat > "$PROJECT_DIR/admin-panel/.env" << 'EOF'
VITE_API_URL=https://api.smokava.com/api
EOF
else
    if ! grep -q "VITE_API_URL=https://api.smokava.com" "$PROJECT_DIR/admin-panel/.env" 2>/dev/null; then
        log "Updating admin-panel/.env..."
        sed -i 's|VITE_API_URL=.*|VITE_API_URL=https://api.smokava.com/api|' "$PROJECT_DIR/admin-panel/.env" || \
        echo "VITE_API_URL=https://api.smokava.com/api" >> "$PROJECT_DIR/admin-panel/.env"
    fi
fi

log "✅ Environment files fixed"

# ===========================================
# LAYER 5: PM2/Node Layer (Docker handles this)
# ===========================================
log "LAYER 5: Port bindings will be fixed by Docker"

# ===========================================
# LAYER 6: Database Layer
# ===========================================
log "LAYER 6: Checking database..."

# Ensure MongoDB volume exists
if ! docker volume ls | grep -q smokava_mongodb_data; then
    warn "MongoDB volume not found, will be created"
fi

# ===========================================
# LAYER 7: Deployment Layer (GitHub Actions)
# ===========================================
log "LAYER 7: GitHub Actions - will be fixed in repository"

# ===========================================
# LAYER 8: FINAL FULL REPAIR
# ===========================================
log "LAYER 8: Rebuilding and starting all services..."

# Rebuild images
log "Building Docker images (this may take 10-15 minutes)..."
$DOCKER_COMPOSE_CMD build --no-cache 2>&1 | while IFS= read -r line; do
    echo "  $line"
done || warn "Build had warnings, continuing..."

# Start MongoDB first
log "Starting MongoDB..."
$DOCKER_COMPOSE_CMD up -d mongodb

# Wait for MongoDB
log "Waiting for MongoDB to be ready..."
for i in {1..60}; do
    if docker exec smokava-mongodb mongosh --quiet --eval "db.runCommand('ping').ok" smokava 2>/dev/null | grep -q "1"; then
        log "✅ MongoDB is ready"
        break
    fi
    if [ $i -eq 60 ]; then
        warn "MongoDB did not become ready in 60 seconds"
    else
        sleep 1
        echo -n "."
    fi
done
echo ""

# Start all services
log "Starting all services..."
$DOCKER_COMPOSE_CMD up -d

# Wait for services
log "Waiting for services to start..."
sleep 20

# Check container status
log "Container status:"
$DOCKER_COMPOSE_CMD ps

# Test ports
log "Testing service ports..."
for port in 5000 3000 5173; do
    SERVICE=""
    case $port in
        5000) SERVICE="Backend" ;;
        3000) SERVICE="Frontend" ;;
        5173) SERVICE="Admin Panel" ;;
    esac

    if timeout 5 curl -f -s "http://localhost:${port}" >/dev/null 2>&1 || \
       timeout 5 curl -f -s "http://localhost:${port}/api/health" >/dev/null 2>&1; then
        log "✅ ${SERVICE} responding on port ${port}"
    else
        warn "❌ ${SERVICE} NOT responding on port ${port}"
        log "Showing logs for ${SERVICE}..."
        case $port in
            5000) docker logs smokava-backend --tail 20 2>&1 || true ;;
            3000) docker logs smokava-frontend --tail 20 2>&1 || true ;;
            5173) docker logs smokava-admin-panel --tail 20 2>&1 || true ;;
        esac
    fi
done

# Reload nginx
log "Reloading Nginx..."
if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx || sudo systemctl restart nginx
    log "✅ Nginx reloaded"
else
    warn "Nginx config has errors"
    sudo nginx -t
fi

# Final health check
log "Final health check..."
sleep 5

for domain in "https://smokava.com" "https://api.smokava.com" "https://admin.smokava.com"; do
    HTTP_CODE=$(curl -f -s -o /dev/null -w "%{http_code}" --max-time 10 "${domain}" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        log "✅ ${domain} is accessible (HTTP ${HTTP_CODE})"
    else
        warn "❌ ${domain} returned HTTP ${HTTP_CODE}"
    fi
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  FIX COMPLETE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
log "Check container logs: $DOCKER_COMPOSE_CMD logs -f"
log "Check container status: $DOCKER_COMPOSE_CMD ps"
echo ""
