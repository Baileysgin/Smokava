#!/bin/bash

# MongoDB Restore Script
# This script restores a MongoDB backup

set -e

echo "📥 MongoDB Restore Script"
echo ""

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/smokava/backups}"
CONTAINER_NAME="smokava-mongodb"
DB_NAME="smokava"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <backup_file>${NC}"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/mongodb_backup_*.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    # Try relative to backup directory
    if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Error: Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

echo "📁 Backup file: $BACKUP_FILE"

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ Error: MongoDB container '$CONTAINER_NAME' is not running${NC}"
    exit 1
fi

# Confirm restore
echo -e "${YELLOW}⚠️  WARNING: This will replace all data in the '$DB_NAME' database!${NC}"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Restore backup
echo "🔄 Restoring backup..."
docker exec -i "$CONTAINER_NAME" mongorestore --archive --gzip --drop --db="$DB_NAME" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Restore completed successfully!${NC}"
else
    echo -e "${RED}❌ Restore failed!${NC}"
    exit 1
fi
