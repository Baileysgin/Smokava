#!/bin/bash

# ===========================================
# SSH KEEPALIVE SCRIPT
# ===========================================
# This script ensures SSH connections stay alive during long operations
# by sending periodic keepalive signals and streaming output

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SSH KEEPALIVE MANAGER${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to execute command with keepalive
execute_with_keepalive() {
    local host="$1"
    local user="${2:-root}"
    local port="${3:-22}"
    local command="$4"
    local timeout="${5:-3600}"  # Default 1 hour timeout

    echo -e "${GREEN}Executing command with SSH keepalive...${NC}"
    echo -e "${YELLOW}Host: ${user}@${host}:${port}${NC}"
    echo -e "${YELLOW}Timeout: ${timeout}s${NC}"
    echo ""

    # Execute with aggressive keepalive settings
    ssh -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o ConnectTimeout=60 \
        -o ServerAliveInterval=20 \
        -o ServerAliveCountMax=10 \
        -o TCPKeepAlive=yes \
        -o BatchMode=yes \
        -p "$port" \
        "${user}@${host}" \
        "bash -c 'set -e; $command'" \
        < /dev/null || {
            echo -e "${YELLOW}⚠️  Command failed, but connection was maintained${NC}"
            return 1
        }
}

# Function to stream output continuously
stream_output() {
    local host="$1"
    local user="${2:-root}"
    local port="${3:-22}"
    local command="$4"

    echo -e "${GREEN}Streaming command output...${NC}"

    # Execute with output streaming and keepalive
    ssh -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o ConnectTimeout=60 \
        -o ServerAliveInterval=20 \
        -o ServerAliveCountMax=10 \
        -o TCPKeepAlive=yes \
        -o BatchMode=yes \
        -p "$port" \
        "${user}@${host}" \
        "bash -c 'set -e; $command'" \
        < /dev/null || {
            echo -e "${YELLOW}⚠️  Command execution completed with exit code: $?${NC}"
            return $?
        }
}

# Main execution
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <host> <command> [user] [port]"
    echo "Example: $0 91.107.241.245 'docker compose up -d' root 22"
    exit 1
fi

HOST="$1"
COMMAND="$2"
USER="${3:-root}"
PORT="${4:-22}"

# Use stream_output for better visibility
stream_output "$HOST" "$USER" "$PORT" "$COMMAND"

echo ""
echo -e "${GREEN}✅ Command execution complete${NC}"
