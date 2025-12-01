#!/bin/bash

# Pre-deploy Health Check Script
# This script verifies that API endpoints are responding before deployment

set -e

# Configuration
API_BASE_URL="${API_BASE_URL:-https://api.smokava.com}"
ADMIN_API_URL="${ADMIN_API_URL:-${API_BASE_URL}/api/admin}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-10}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[HEALTH CHECK]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log "Starting health check..."

# Check if curl is available
if ! command -v curl >/dev/null 2>&1; then
    error "curl is required but not installed"
fi

# Check API health endpoint
log "Checking API health endpoint: ${API_BASE_URL}/api/health"
API_HEALTH=$(curl -s -m "$HEALTH_CHECK_TIMEOUT" "${API_BASE_URL}/api/health" || echo "")

if [ -z "$API_HEALTH" ]; then
    error "API health endpoint is not responding"
fi

# Parse health response (basic check)
if echo "$API_HEALTH" | grep -q '"status":"healthy"'; then
    log "API health check passed"
else
    warn "API health check returned unexpected response: $API_HEALTH"
fi

# Check database connection in health response
if echo "$API_HEALTH" | grep -q '"database":"connected"'; then
    log "Database connection verified"
else
    warn "Database connection status unclear"
fi

log "Health check completed successfully"
