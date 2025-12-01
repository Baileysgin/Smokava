#!/bin/bash

# Database Restore Script for Smokava
# This script restores MongoDB from a backup file

set -e

# Configuration
BACKUP_FILE=$1
MONGODB_URI="${MONGODB_URI:-mongodb://mongodb:27017/smokava}"
DB_NAME="${DB_NAME:-smokava}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[RESTORE]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    error "Usage: $0 <backup-file>"
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
fi

log "Restoring from: $BACKUP_FILE"

# Determine docker compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    error "Neither 'docker compose' nor 'docker-compose' found!"
fi

# Extract connection details from MONGODB_URI
if [[ "$MONGODB_URI" == mongodb+srv://* ]]; then
    # MongoDB Atlas connection - use mongorestore directly
    log "Using MongoDB Atlas connection"
    if command -v mongorestore >/dev/null 2>&1; then
        mongorestore --uri="$MONGODB_URI" --archive="$BACKUP_FILE" --gzip --drop
    else
        error "mongorestore not found and MongoDB Atlas requires it"
    fi
else
    # Local MongoDB connection - use docker exec
    HOST_PORT=$(echo "$MONGODB_URI" | sed -E 's|mongodb://([^/]+)/.*|\1|')
    HOST=$(echo "$HOST_PORT" | cut -d: -f1)
    PORT=$(echo "$HOST_PORT" | cut -d: -f2)

    if [ -z "$PORT" ]; then
        PORT=27017
    fi

    log "Connecting to MongoDB at $HOST:$PORT"

    # Try to use docker exec if MongoDB is in a container
    if [ "$HOST" = "mongodb" ] || [ "$HOST" = "localhost" ] || [ "$HOST" = "127.0.0.1" ]; then
        # Find MongoDB container name
        MONGODB_CONTAINER=$($DOCKER_COMPOSE_CMD ps -q mongodb 2>/dev/null || echo "")
        if [ -n "$MONGODB_CONTAINER" ]; then
            log "Using docker exec to run mongorestore inside MongoDB container"
            docker cp "$BACKUP_FILE" "$MONGODB_CONTAINER:/tmp/restore.gz"
            docker exec "$MONGODB_CONTAINER" mongorestore --host="$HOST" --port="$PORT" --db="$DB_NAME" --archive=/tmp/restore.gz --gzip --drop
            docker exec "$MONGODB_CONTAINER" rm -f /tmp/restore.gz
        elif command -v mongorestore >/dev/null 2>&1; then
            # Fallback to local mongorestore if container not found
            log "MongoDB container not found, using local mongorestore"
            mongorestore --host="$HOST" --port="$PORT" --db="$DB_NAME" --archive="$BACKUP_FILE" --gzip --drop
        else
            error "mongorestore not found and MongoDB container not running"
        fi
    elif command -v mongorestore >/dev/null 2>&1; then
        # Use local mongorestore for remote connections
        mongorestore --host="$HOST" --port="$PORT" --db="$DB_NAME" --archive="$BACKUP_FILE" --gzip --drop
    else
        error "mongorestore not found"
    fi
fi

log "Restore completed successfully!"
