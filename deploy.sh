#!/bin/bash

# Deployment script for Smokava project
# Usage: ./deploy.sh

set -e  # Exit on error

# Server configuration (can be overridden by environment variables)
SERVER_IP="${SERVER_IP:-91.107.241.245}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-pqwRU4qhpVW7}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/smokava}"

echo "🚀 Starting deployment to $SERVER_USER@$SERVER_IP:$SERVER_PORT"

# Check if sshpass is installed (for password authentication)
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command -v brew &> /dev/null; then
            echo "❌ Please install Homebrew first: https://brew.sh"
            exit 1
        fi
        brew install hudochenkov/sshpass/sshpass
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    else
        echo "❌ Please install sshpass manually"
        exit 1
    fi
fi

# Function to execute remote commands
remote_exec() {
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "$@"
}

# Function to copy files
remote_copy() {
    sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -P "$SERVER_PORT" -r "$1" "$SERVER_USER@$SERVER_IP:$2"
}

echo "📦 Creating deployment package..."

# Create a temporary directory for deployment
TEMP_DIR=$(mktemp -d)
DEPLOY_PACKAGE="$TEMP_DIR/smokava-deploy.tar.gz"

# Create .tar.gz excluding unnecessary files
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='backend/.env' \
    --exclude='frontend/.env.local' \
    --exclude='admin-panel/.env' \
    -czf "$DEPLOY_PACKAGE" .

echo "📤 Uploading project to server..."

# Create deployment directory on server
remote_exec "mkdir -p $DEPLOY_DIR"

# Upload the package
remote_copy "$DEPLOY_PACKAGE" "$DEPLOY_DIR/"

echo "🔧 Setting up server..."

# Run setup script on server
remote_exec "cd $DEPLOY_DIR && \
    tar -xzf smokava-deploy.tar.gz && \
    rm smokava-deploy.tar.gz && \
    chmod +x deploy-server.sh && \
    ./deploy-server.sh"

echo "✅ Deployment complete!"
echo ""
echo "🌐 Services should be available at:"
echo "   - Frontend: http://$SERVER_IP:3000"
echo "   - Backend API: http://$SERVER_IP:5000"
echo "   - Admin Panel: http://$SERVER_IP:5173"
echo ""
echo "📋 To check status: ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP 'cd $DEPLOY_DIR && docker-compose ps'"
echo "📋 To view logs: ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP 'cd $DEPLOY_DIR && docker-compose logs -f'"

# Cleanup
rm -rf "$TEMP_DIR"



