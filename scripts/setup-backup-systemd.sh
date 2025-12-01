#!/bin/bash

# Setup Systemd Timer for Hourly Backups
# Alternative to cron - uses systemd timer for more control

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root or with sudo"
fi

PROJECT_DIR="${PROJECT_DIR:-/opt/smokava}"
BACKUP_SCRIPT="$PROJECT_DIR/scripts/db-backup.sh"

# Verify backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    error "Backup script not found: $BACKUP_SCRIPT"
fi

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/smokava-backup.service"
TIMER_FILE="/etc/systemd/system/smokava-backup.timer"

log "Creating systemd service and timer..."

# Create service file
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Smokava Database Backup
After=network.target docker.service

[Service]
Type=oneshot
ExecStart=$BACKUP_SCRIPT
User=root
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create timer file
cat > "$TIMER_FILE" << EOF
[Unit]
Description=Run Smokava Database Backup Hourly
Requires=smokava-backup.service

[Timer]
OnCalendar=hourly
Persistent=true
AccuracySec=1min

[Install]
WantedBy=timers.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable and start timer
systemctl enable smokava-backup.timer
systemctl start smokava-backup.timer

log "✅ Systemd timer installed successfully!"
log "Backup will run every hour"
log ""
log "To check timer status: systemctl status smokava-backup.timer"
log "To check service status: systemctl status smokava-backup.service"
log "To view logs: journalctl -u smokava-backup.service -f"
log "To test backup manually: systemctl start smokava-backup.service"

