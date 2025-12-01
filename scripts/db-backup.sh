#!/bin/bash

# MongoDB Backup Script for Smokava
# This script creates hourly backups of the MongoDB database
# Backups are stored in /var/backups/smokava/ with timestamped filenames
# Old backups are automatically rotated (keeps last 168 backups = 7 days of hourly backups)

set -e

# Configuration
BACKUP_DIR="${BACKUP_PATH:-/var/backups/smokava}"
# MONGODB_URI must be set in environment (from .env or docker-compose)
# Default to Docker service name if not set
MONGODB_URI="${MONGODB_URI:-mongodb://mongodb:27017/smokava}"
DB_NAME="${DB_NAME:-smokava}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
RETENTION_HOURS=$((RETENTION_DAYS * 24))

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/smokava_backup_${TIMESTAMP}.gz"
LOG_FILE="$BACKUP_DIR/backup.log"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting backup process..."

# Determine docker compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    log "ERROR: Neither 'docker compose' nor 'docker-compose' found!"
    exit 1
fi

# Extract connection details from MONGODB_URI
# Handle both mongodb:// and mongodb+srv:// formats
if [[ "$MONGODB_URI" == mongodb+srv://* ]]; then
    # MongoDB Atlas connection - use mongodump directly
    log "Using MongoDB Atlas connection"
    if command -v mongodump >/dev/null 2>&1; then
        mongodump --uri="$MONGODB_URI" --archive="$BACKUP_FILE" --gzip
    else
        log "ERROR: mongodump not found and MongoDB Atlas requires it"
        exit 1
    fi
else
    # Local MongoDB connection - use docker exec to run mongodump inside container
    # Extract host, port, and database from URI
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
            log "Using docker exec to run mongodump inside MongoDB container"
            docker exec "$MONGODB_CONTAINER" mongodump --host="$HOST" --port="$PORT" --db="$DB_NAME" --archive=/tmp/backup.gz --gzip
            docker cp "$MONGODB_CONTAINER:/tmp/backup.gz" "$BACKUP_FILE"
            docker exec "$MONGODB_CONTAINER" rm -f /tmp/backup.gz
        elif command -v mongodump >/dev/null 2>&1; then
            # Fallback to local mongodump if container not found
            log "MongoDB container not found, using local mongodump"
            mongodump --host="$HOST" --port="$PORT" --db="$DB_NAME" --archive="$BACKUP_FILE" --gzip
        else
            log "ERROR: mongodump not found and MongoDB container not running"
            exit 1
        fi
    elif command -v mongodump >/dev/null 2>&1; then
        # Use local mongodump for remote connections
        mongodump --host="$HOST" --port="$PORT" --db="$DB_NAME" --archive="$BACKUP_FILE" --gzip
    else
        log "ERROR: mongodump not found"
        exit 1
    fi
fi

# Check if backup was successful
BACKUP_EXIT_CODE=$?
if [ $BACKUP_EXIT_CODE -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    BACKUP_SIZE_BYTES=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")
    
    # Verify backup file is not empty
    if [ "$BACKUP_SIZE_BYTES" -lt 1000 ]; then
        log "ERROR: Backup file is too small ($BACKUP_SIZE_BYTES bytes) - backup may be corrupted!"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
    
    log "Backup completed successfully: $BACKUP_FILE (Size: $BACKUP_SIZE)"

    # Update last backup timestamp file
    echo "$TIMESTAMP" > "$BACKUP_DIR/last_backup.txt"
    echo "$BACKUP_FILE" > "$BACKUP_DIR/last_backup_path.txt"

    # Rotate old backups (keep last N backups)
    log "Rotating old backups (keeping last $RETENTION_HOURS backups)..."
    cd "$BACKUP_DIR"
    OLD_BACKUPS=$(ls -t smokava_backup_*.gz 2>/dev/null | tail -n +$((RETENTION_HOURS + 1)) | wc -l)
    if [ "$OLD_BACKUPS" -gt 0 ]; then
        ls -t smokava_backup_*.gz 2>/dev/null | tail -n +$((RETENTION_HOURS + 1)) | xargs -r rm -f
        log "Removed $OLD_BACKUPS old backup(s)"
    else
        log "No old backups to remove"
    fi
    log "Backup rotation completed"

    # Count remaining backups
    BACKUP_COUNT=$(ls -1 smokava_backup_*.gz 2>/dev/null | wc -l)
    log "Total backups retained: $BACKUP_COUNT"

    # Verify backup integrity (quick check)
    log "Verifying backup integrity..."
    if command -v gzip >/dev/null 2>&1; then
        if gzip -t "$BACKUP_FILE" 2>/dev/null; then
            log "Backup integrity verified"
        else
            log "WARNING: Backup file may be corrupted (gzip test failed)"
        fi
    fi

    exit 0
else
    log "ERROR: Backup failed! Exit code: $BACKUP_EXIT_CODE"
    if [ -f "$BACKUP_FILE" ]; then
        rm -f "$BACKUP_FILE"
        log "Removed incomplete backup file"
    fi
    exit 1
fi
