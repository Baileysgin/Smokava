#!/bin/bash

# Script to add GitHub Actions SSH public key to server

set -e

echo "🔑 Adding GitHub Actions SSH key to server..."
echo ""

# Server details (from deploy script)
SERVER="root@91.107.241.245"
SSH_PASS="pqwRU4qhpVW7"
PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIzvQFTtnH7l+4EAWc3KiNwP+W5/E1iLjyp335a7E01u github-actions-smokava"

echo "📤 Adding public key to server: $SERVER"
echo ""

# Add public key to server
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SERVER" "
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    if ! grep -q 'github-actions-smokava' ~/.ssh/authorized_keys 2>/dev/null; then
        echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys
        chmod 600 ~/.ssh/authorized_keys
        echo '✅ Public key added to server!'
    else
        echo '⚠️  Public key already exists on server'
    fi
"

echo ""
echo "✅ SSH key setup complete!"
echo ""
echo "📋 Next: Add secrets to GitHub:"
echo "   1. Go to: https://github.com/Baileysgin/Smokava/settings/secrets/actions"
echo "   2. Add the 3 secrets (see GITHUB_SECRETS_SETUP.md)"
echo ""
