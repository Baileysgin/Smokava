#!/bin/bash

# Setup Hourly Backup Cron Job
# This script sets up automatic hourly backups for Smokava database

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root or with sudo"
fi

PROJECT_DIR="${PROJECT_DIR:-/opt/smokava}"
BACKUP_SCRIPT="$PROJECT_DIR/scripts/db-backup.sh"
LOG_FILE="/var/log/smokava-backup.log"

# Verify backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    error "Backup script not found: $BACKUP_SCRIPT"
fi

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"

# Create log file if it doesn't exist
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

# Create backup directory
BACKUP_DIR="${BACKUP_PATH:-/var/backups/smokava}"
mkdir -p "$BACKUP_DIR"
chmod 755 "$BACKUP_DIR"

log "Setting up hourly backup cron job..."

# Check if cron job already exists
CRON_JOB="0 * * * * $BACKUP_SCRIPT >> $LOG_FILE 2>&1"

if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    warn "Backup cron job already exists"
    echo "Current cron jobs:"
    crontab -l | grep "$BACKUP_SCRIPT"
    read -p "Replace existing cron job? (yes/no): " REPLACE
    if [ "$REPLACE" = "yes" ]; then
        # Remove existing backup cron job
        crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | crontab -
        log "Removed existing backup cron job"
    else
        log "Keeping existing cron job"
        exit 0
    fi
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

log "✅ Hourly backup cron job installed successfully!"
log "Backup will run every hour at :00"
log "Backups stored in: $BACKUP_DIR"
log "Log file: $LOG_FILE"

# Verify cron job was added
log "Verifying cron job..."
crontab -l | grep "$BACKUP_SCRIPT" || error "Failed to add cron job"

log "Setup complete!"
log ""
log "To view cron jobs: crontab -l"
log "To test backup manually: $BACKUP_SCRIPT"
log "To view backup logs: tail -f $LOG_FILE"

