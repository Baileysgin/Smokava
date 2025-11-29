#!/bin/bash

# MongoDB Backup Script
# This script creates a backup of the MongoDB database from the Docker container

set -e

echo "💾 MongoDB Backup Script"
echo ""

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/smokava/backups}"
CONTAINER_NAME="smokava-mongodb"
DB_NAME="smokava"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mongodb_backup_${TIMESTAMP}.gz"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ Error: MongoDB container '$CONTAINER_NAME' is not running${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
echo "📁 Backup directory: $BACKUP_DIR"

# Create backup
echo "🔄 Creating backup..."
docker exec "$CONTAINER_NAME" mongodump --archive --gzip --db="$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup created successfully!${NC}"
    echo "   File: $BACKUP_DIR/$BACKUP_FILE"
    echo "   Size: $BACKUP_SIZE"

    # Keep only last 10 backups
    echo ""
    echo "🧹 Cleaning old backups (keeping last 10)..."
    cd "$BACKUP_DIR"
    ls -t mongodb_backup_*.gz | tail -n +11 | xargs -r rm -f

    echo -e "${GREEN}✅ Backup complete!${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

echo ""
echo "📋 Backup List:"
ls -lh "$BACKUP_DIR"/mongodb_backup_*.gz 2>/dev/null | tail -5 || echo "No backups found"
