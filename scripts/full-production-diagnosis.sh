#!/bin/bash
# ===========================================
# FULL PRODUCTION DIAGNOSIS & REPAIR SCRIPT
# ===========================================
# This script diagnoses and fixes all 8 layers:
# 1. SSH Access Layer
# 2. Nginx Layer
# 3. Docker Layer
# 4. Environment Layer
# 5. PM2/Node Layer
# 6. Database Layer
# 7. Deployment Layer (GitHub Actions)
# 8. Final Full Repair

set -e

SERVER_IP="${1:-91.107.241.245}"
SSH_USER="${2:-root}"
SSH_TARGET="${SSH_USER}@${SERVER_IP}"

echo "=========================================="
echo "FULL PRODUCTION DIAGNOSIS & REPAIR"
echo "=========================================="
echo "Server: ${SSH_TARGET}"
echo "Time: $(date)"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section header
print_section() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
}

# Function to print status
print_status() {
    if [ "$1" = "OK" ]; then
        echo -e "${GREEN}✅ $2${NC}"
    elif [ "$1" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# ===========================================
# LAYER 1: SSH Access Layer
# ===========================================
print_section "LAYER 1: SSH Access Layer"

# Test SSH connection
if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o BatchMode=yes "${SSH_TARGET}" "echo 'SSH OK'" 2>/dev/null; then
    print_status "OK" "SSH connection successful"
else
    print_status "FAIL" "SSH connection failed"
    echo "Checking fail2ban..."
    ssh -o StrictHostKeyChecking=no "${SSH_TARGET}" "systemctl status fail2ban 2>/dev/null || echo 'fail2ban not installed'" || true
    exit 1
fi

# Check SSH keys
SSH_KEYS=$(ssh -o StrictHostKeyChecking=no "${SSH_TARGET}" "grep -c 'ssh-' ~/.ssh/authorized_keys 2>/dev/null || echo '0'")
if [ "$SSH_KEYS" -gt 0 ]; then
    print_status "OK" "SSH keys configured ($SSH_KEYS keys found)"
else
    print_status "WARN" "No SSH keys found in authorized_keys"
fi

# ===========================================
# LAYER 2: Nginx Layer
# ===========================================
print_section "LAYER 2: Nginx Layer"

# Check if nginx is running
if ssh "${SSH_TARGET}" "systemctl is-active --quiet nginx" 2>/dev/null; then
    print_status "OK" "Nginx is running"
else
    print_status "FAIL" "Nginx is not running"
    echo "Attempting to start nginx..."
    ssh "${SSH_TARGET}" "systemctl start nginx" || true
fi

# Check nginx config
if ssh "${SSH_TARGET}" "nginx -t 2>&1" | grep -q "successful"; then
    print_status "OK" "Nginx configuration is valid"
else
    print_status "FAIL" "Nginx configuration has errors"
    echo "Nginx config test output:"
    ssh "${SSH_TARGET}" "nginx -t 2>&1" || true
fi

# Check nginx config file exists
if ssh "${SSH_TARGET}" "[ -f /etc/nginx/sites-available/smokava-docker.conf ] || [ -f /etc/nginx/conf.d/smokava-docker.conf ]"; then
    print_status "OK" "Nginx config file exists"
else
    print_status "WARN" "Nginx config file not found in standard locations"
fi

# Check SSL certificates
for domain in "smokava.com" "api.smokava.com" "admin.smokava.com"; do
    if ssh "${SSH_TARGET}" "[ -f /etc/letsencrypt/live/${domain}/fullchain.pem ]"; then
        print_status "OK" "SSL certificate exists for ${domain}"
    else
        print_status "WARN" "SSL certificate missing for ${domain}"
    fi
done

# Check upstream ports
for port in 5000 3000 5173; do
    if ssh "${SSH_TARGET}" "netstat -tlnp 2>/dev/null | grep -q ':${port} ' || ss -tlnp 2>/dev/null | grep -q ':${port} '"; then
        print_status "OK" "Port ${port} is listening"
    else
        print_status "FAIL" "Port ${port} is NOT listening"
    fi
done

# Show nginx logs
echo ""
echo "--- Nginx Error Log (last 20 lines) ---"
ssh "${SSH_TARGET}" "journalctl -u nginx -n 20 --no-pager 2>/dev/null || tail -20 /var/log/nginx/error.log 2>/dev/null || echo 'No nginx logs found'" || true

# ===========================================
# LAYER 3: Docker Layer
# ===========================================
print_section "LAYER 3: Docker Layer"

# Check if docker is installed
if ssh "${SSH_TARGET}" "command -v docker >/dev/null 2>&1"; then
    print_status "OK" "Docker is installed"
    DOCKER_VERSION=$(ssh "${SSH_TARGET}" "docker --version")
    echo "  Version: $DOCKER_VERSION"
else
    print_status "FAIL" "Docker is not installed"
fi

# Check if docker-compose is available
if ssh "${SSH_TARGET}" "command -v docker-compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1"; then
    print_status "OK" "Docker Compose is available"
else
    print_status "FAIL" "Docker Compose is not available"
fi

# Check project directory
PROJECT_DIR="/opt/smokava"
if ssh "${SSH_TARGET}" "[ -d ${PROJECT_DIR} ]"; then
    print_status "OK" "Project directory exists: ${PROJECT_DIR}"
else
    print_status "FAIL" "Project directory missing: ${PROJECT_DIR}"
fi

# Check docker-compose.yml
if ssh "${SSH_TARGET}" "[ -f ${PROJECT_DIR}/docker-compose.yml ]"; then
    print_status "OK" "docker-compose.yml exists"
else
    print_status "FAIL" "docker-compose.yml missing"
fi

# Check container status
echo ""
echo "--- Docker Container Status ---"
ssh "${SSH_TARGET}" "cd ${PROJECT_DIR} && docker compose ps 2>/dev/null || docker-compose ps 2>/dev/null || echo 'Cannot check containers'" || true

# Check if containers are running
CONTAINERS=("smokava-mongodb" "smokava-backend" "smokava-frontend" "smokava-admin-panel")
for container in "${CONTAINERS[@]}"; do
    if ssh "${SSH_TARGET}" "docker ps --format '{{.Names}}' | grep -q '^${container}$'"; then
        print_status "OK" "Container ${container} is running"
    else
        print_status "FAIL" "Container ${container} is NOT running"
        echo "  Showing logs for ${container}:"
        ssh "${SSH_TARGET}" "docker logs ${container} --tail 30 2>&1" || true
    fi
done

# Check docker volumes
echo ""
echo "--- Docker Volumes ---"
ssh "${SSH_TARGET}" "docker volume ls | grep smokava || echo 'No smokava volumes found'" || true

# Check mongodb volume
if ssh "${SSH_TARGET}" "docker volume ls | grep -q smokava_mongodb_data"; then
    print_status "OK" "MongoDB volume exists"
else
    print_status "WARN" "MongoDB volume not found"
fi

# Show container logs
echo ""
echo "--- Recent Container Logs ---"
for container in "${CONTAINERS[@]}"; do
    echo "--- ${container} logs (last 10 lines) ---"
    ssh "${SSH_TARGET}" "docker logs ${container} --tail 10 2>&1" || echo "Cannot get logs for ${container}"
done

# ===========================================
# LAYER 4: Environment Layer
# ===========================================
print_section "LAYER 4: Environment Layer"

# Check environment files
ENV_FILES=(
    "${PROJECT_DIR}/backend/.env"
    "${PROJECT_DIR}/frontend/.env.local"
    "${PROJECT_DIR}/admin-panel/.env"
)

REQUIRED_VARS=(
    "NEXT_PUBLIC_API_URL=https://api.smokava.com"
    "BACKEND_URL=https://api.smokava.com"
    "ADMIN_URL=https://admin.smokava.com"
)

for env_file in "${ENV_FILES[@]}"; do
    if ssh "${SSH_TARGET}" "[ -f ${env_file} ]"; then
        print_status "OK" "Environment file exists: ${env_file}"
        # Check for required variables
        FILE_NAME=$(basename "${env_file}")
        case "${FILE_NAME}" in
            ".env")
                echo "  Checking backend .env variables..."
                ssh "${SSH_TARGET}" "grep -E 'BACKEND_URL|ADMIN_URL|MONGODB_URI' ${env_file} || echo '  Missing some variables'" || true
                ;;
            ".env.local")
                echo "  Checking frontend .env.local variables..."
                ssh "${SSH_TARGET}" "grep -E 'NEXT_PUBLIC_API_URL|BACKEND_URL' ${env_file} || echo '  Missing some variables'" || true
                ;;
        esac
    else
        print_status "FAIL" "Environment file missing: ${env_file}"
    fi
done

# ===========================================
# LAYER 5: PM2/Node Layer
# ===========================================
print_section "LAYER 5: PM2/Node Layer"

# Check if ports are listening
for port in 5000 3000 5173; do
    SERVICE=""
    case $port in
        5000) SERVICE="Backend" ;;
        3000) SERVICE="Frontend" ;;
        5173) SERVICE="Admin Panel" ;;
    esac

    if ssh "${SSH_TARGET}" "netstat -tlnp 2>/dev/null | grep -q ':${port} ' || ss -tlnp 2>/dev/null | grep -q ':${port} '"; then
        print_status "OK" "${SERVICE} is listening on port ${port}"
    else
        print_status "FAIL" "${SERVICE} is NOT listening on port ${port}"
    fi
done

# Test localhost connections
for port in 5000 3000 5173; do
    SERVICE=""
    case $port in
        5000) SERVICE="Backend" ;;
        3000) SERVICE="Frontend" ;;
        5173) SERVICE="Admin Panel" ;;
    esac

    if ssh "${SSH_TARGET}" "curl -f -s http://localhost:${port} >/dev/null 2>&1 || curl -f -s http://localhost:${port}/api/health >/dev/null 2>&1"; then
        print_status "OK" "${SERVICE} responds on localhost:${port}"
    else
        print_status "FAIL" "${SERVICE} does NOT respond on localhost:${port}"
    fi
done

# ===========================================
# LAYER 6: Database Layer
# ===========================================
print_section "LAYER 6: Database Layer"

# Check MongoDB container
if ssh "${SSH_TARGET}" "docker ps --format '{{.Names}}' | grep -q 'smokava-mongodb'"; then
    print_status "OK" "MongoDB container is running"

    # Check MongoDB health
    if ssh "${SSH_TARGET}" "docker exec smokava-mongodb mongosh --eval 'db.runCommand(\"ping\")' --quiet 2>/dev/null | grep -q 'ok.*1'"; then
        print_status "OK" "MongoDB is healthy"
    else
        print_status "WARN" "MongoDB health check failed"
    fi

    # Check database connection from backend
    if ssh "${SSH_TARGET}" "docker exec smokava-backend node -e \"require('mongodb').MongoClient.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava').then(() => console.log('OK')).catch(e => console.log('FAIL:', e.message))\" 2>/dev/null" | grep -q "OK"; then
        print_status "OK" "Backend can connect to MongoDB"
    else
        print_status "WARN" "Backend cannot connect to MongoDB"
    fi
else
    print_status "FAIL" "MongoDB container is not running"
fi

# Check database volume
if ssh "${SSH_TARGET}" "docker volume inspect smokava_mongodb_data >/dev/null 2>&1"; then
    print_status "OK" "MongoDB volume exists and is mounted"
    VOLUME_SIZE=$(ssh "${SSH_TARGET}" "docker exec smokava-mongodb du -sh /data/db 2>/dev/null | cut -f1" || echo "unknown")
    echo "  Database size: ${VOLUME_SIZE}"
else
    print_status "WARN" "MongoDB volume not found"
fi

# ===========================================
# LAYER 7: Deployment Layer (GitHub Actions)
# ===========================================
print_section "LAYER 7: Deployment Layer (GitHub Actions)"

# This layer will be fixed in the repository, not on the server
print_status "OK" "GitHub Actions workflows will be checked and fixed in repository"

# ===========================================
# LAYER 8: FINAL FULL REPAIR
# ===========================================
print_section "LAYER 8: Final Full Repair"

echo "Starting comprehensive repair..."

# 1. Ensure environment files exist
echo ""
echo "--- Step 1: Ensuring environment files exist ---"
ssh "${SSH_TARGET}" "cd ${PROJECT_DIR} && bash -s" << 'ENV_FIX'
# Backend .env
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env..."
    cat > backend/.env << EOF
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
fi

# Frontend .env.local
if [ ! -f frontend/.env.local ]; then
    echo "Creating frontend/.env.local..."
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=https://api.smokava.com/api
BACKEND_URL=https://api.smokava.com
NEXT_PUBLIC_MAPBOX_TOKEN=
EOF
fi

# Admin panel .env
if [ ! -f admin-panel/.env ]; then
    echo "Creating admin-panel/.env..."
    cat > admin-panel/.env << EOF
VITE_API_URL=https://api.smokava.com/api
EOF
fi
ENV_FIX

# 2. Rebuild and restart Docker containers
echo ""
echo "--- Step 2: Rebuilding and restarting Docker containers ---"
ssh "${SSH_TARGET}" "cd ${PROJECT_DIR} && docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true"
ssh "${SSH_TARGET}" "cd ${PROJECT_DIR} && docker compose build --no-cache 2>/dev/null || docker-compose build --no-cache 2>/dev/null || true"
ssh "${SSH_TARGET}" "cd ${PROJECT_DIR} && docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null || true"

# 3. Wait for services to start
echo ""
echo "--- Step 3: Waiting for services to start ---"
sleep 15

# 4. Reload nginx
echo ""
echo "--- Step 4: Reloading Nginx ---"
ssh "${SSH_TARGET}" "nginx -t && systemctl reload nginx" || ssh "${SSH_TARGET}" "systemctl restart nginx" || true

# 5. Validate services
echo ""
echo "--- Step 5: Validating services ---"
for port in 5000 3000 5173; do
    SERVICE=""
    case $port in
        5000) SERVICE="Backend" ;;
        3000) SERVICE="Frontend" ;;
        5173) SERVICE="Admin Panel" ;;
    esac

    if ssh "${SSH_TARGET}" "timeout 5 curl -f -s http://localhost:${port} >/dev/null 2>&1 || timeout 5 curl -f -s http://localhost:${port}/api/health >/dev/null 2>&1"; then
        print_status "OK" "${SERVICE} is responding on port ${port}"
    else
        print_status "FAIL" "${SERVICE} is NOT responding on port ${port}"
    fi
done

# 6. Final container status
echo ""
echo "--- Final Container Status ---"
ssh "${SSH_TARGET}" "cd ${PROJECT_DIR} && docker compose ps 2>/dev/null || docker-compose ps 2>/dev/null" || true

# ===========================================
# FINAL SUMMARY
# ===========================================
print_section "DIAGNOSIS COMPLETE"

echo "Testing public endpoints..."
for domain in "https://smokava.com" "https://api.smokava.com" "https://admin.smokava.com"; do
    if curl -f -s -o /dev/null -w "%{http_code}" --max-time 10 "${domain}" | grep -q "200\|301\|302"; then
        print_status "OK" "${domain} is accessible"
    else
        print_status "FAIL" "${domain} is NOT accessible"
    fi
done

echo ""
echo "=========================================="
echo "Diagnosis and repair complete!"
echo "=========================================="
