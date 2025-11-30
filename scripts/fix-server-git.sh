#!/bin/bash

# Fix Git Configuration on Server
# This script configures git to use SSH instead of HTTPS for automated pulls

set -e

echo "🔧 Fixing Git Configuration on Server..."
echo ""

# Server details
SERVER="root@91.107.241.245"
SSH_PASS="pqwRU4qhpVW7"
REMOTE_DIR="/opt/smokava"

# Function to run SSH command
run_ssh() {
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=20 "$SERVER" "$1"
}

echo "📋 Current git remote configuration:"
run_ssh "cd $REMOTE_DIR && git remote -v"

echo ""
echo "🔄 Option 1: Switching to SSH URL (Recommended)"
echo "This requires SSH key to be set up on GitHub"
run_ssh "cd $REMOTE_DIR && git remote set-url origin git@github.com:Baileysgin/Smokava.git" || {
    echo "⚠️  SSH URL switch failed. Trying HTTPS with token method..."
}

echo ""
echo "🔄 Option 2: Setting up Git Credential Helper"
echo "This will cache credentials for HTTPS"
run_ssh "cd $REMOTE_DIR && git config --global credential.helper store" || echo "⚠️  Credential helper setup failed"

echo ""
echo "📝 Instructions for manual setup:"
echo ""
echo "1. SSH into the server:"
echo "   ssh root@91.107.241.245"
echo ""
echo "2. Navigate to project:"
echo "   cd /opt/smokava"
echo ""
echo "3. Choose one of these options:"
echo ""
echo "   Option A - Use SSH (Best for automation):"
echo "   - Generate SSH key: ssh-keygen -t ed25519 -C 'server@smokava'"
echo "   - Copy public key: cat ~/.ssh/id_ed25519.pub"
echo "   - Add to GitHub: Settings > SSH and GPG keys > New SSH key"
echo "   - Change remote: git remote set-url origin git@github.com:Baileysgin/Smokava.git"
echo ""
echo "   Option B - Use Personal Access Token (HTTPS):"
echo "   - Create token: GitHub > Settings > Developer settings > Personal access tokens"
echo "   - Use token as password when pulling"
echo "   - Or set: git config --global credential.helper store"
echo "   - Then: git pull (enter username and token as password once)"
echo ""
echo "   Option C - Use GitHub CLI:"
echo "   - Install: apt install gh"
echo "   - Login: gh auth login"
echo ""
echo "4. Test:"
echo "   git pull origin main"
