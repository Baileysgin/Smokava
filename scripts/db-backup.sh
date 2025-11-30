#!/bin/bash

# MongoDB Backup Script for Smokava
# This script creates hourly backups of the MongoDB database
# Backups are stored in /var/backups/smokava/ with timestamped filenames
# Old backups are automatically rotated (keeps last 168 backups = 7 days of hourly backups)

set -e

# Configuration
BACKUP_DIR="${BACKUP_PATH:-/var/backups/smokava}"
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/smokava}"
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

# Extract connection details from MONGODB_URI
# Handle both mongodb:// and mongodb+srv:// formats
if [[ "$MONGODB_URI" == mongodb+srv://* ]]; then
    # MongoDB Atlas connection
    log "Using MongoDB Atlas connection"
    mongodump --uri="$MONGODB_URI" --archive="$BACKUP_FILE" --gzip
else
    # Local MongoDB connection
    # Extract host, port, and database from URI
    HOST_PORT=$(echo "$MONGODB_URI" | sed -E 's|mongodb://([^/]+)/.*|\1|')
    HOST=$(echo "$HOST_PORT" | cut -d: -f1)
    PORT=$(echo "$HOST_PORT" | cut -d: -f2)

    if [ -z "$PORT" ]; then
        PORT=27017
    fi

    log "Connecting to MongoDB at $HOST:$PORT"
    mongodump --host="$HOST" --port="$PORT" --db="$DB_NAME" --archive="$BACKUP_FILE" --gzip
fi

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup completed successfully: $BACKUP_FILE (Size: $BACKUP_SIZE)"

    # Update last backup timestamp file
    echo "$TIMESTAMP" > "$BACKUP_DIR/last_backup.txt"

    # Rotate old backups (keep last N backups)
    log "Rotating old backups (keeping last $RETENTION_HOURS backups)..."
    cd "$BACKUP_DIR"
    ls -t smokava_backup_*.gz 2>/dev/null | tail -n +$((RETENTION_HOURS + 1)) | xargs -r rm -f
    log "Backup rotation completed"

    # Count remaining backups
    BACKUP_COUNT=$(ls -1 smokava_backup_*.gz 2>/dev/null | wc -l)
    log "Total backups retained: $BACKUP_COUNT"

    exit 0
else
    log "ERROR: Backup failed!"
    exit 1
fi
