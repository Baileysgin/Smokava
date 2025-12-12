#!/bin/bash
# ===========================================
# EXECUTE 502 FIX - ONE COMMAND
# ===========================================
# This script uploads the fix script to server and runs it
# Usage: bash EXECUTE_FIX_NOW.sh

set -e

SERVER_IP="91.107.241.245"
SSH_USER="root"
SSH_TARGET="${SSH_USER}@${SERVER_IP}"

echo "=========================================="
echo "UPLOADING AND EXECUTING 502 FIX"
echo "=========================================="
echo "Server: ${SSH_TARGET}"
echo ""

# Check if SSH key is available
if [ -f ~/.ssh/id_rsa ] || [ -f ~/.ssh/id_ed25519 ]; then
    echo "✅ SSH key found"
else
    echo "⚠️  No SSH key found in ~/.ssh/"
    echo "Please ensure you have SSH access configured"
    echo ""
    echo "To test SSH:"
    echo "  ssh ${SSH_TARGET} 'echo SSH works'"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to cancel..."
fi

# Upload fix script
echo ""
echo "📤 Uploading fix script to server..."
scp scripts/complete-502-fix.sh "${SSH_TARGET}:/tmp/complete-502-fix.sh" || {
    echo "❌ Failed to upload script"
    echo ""
    echo "Manual steps:"
    echo "1. SSH to server: ssh ${SSH_TARGET}"
    echo "2. Copy script content or pull from git"
    echo "3. Run: bash /opt/smokava/scripts/complete-502-fix.sh"
    exit 1
}

# Upload diagnostic script
echo "📤 Uploading diagnostic script..."
scp scripts/full-production-diagnosis.sh "${SSH_TARGET}:/tmp/full-production-diagnosis.sh" || echo "⚠️  Diagnostic script upload failed (optional)"

# Make scripts executable on server
echo "🔧 Making scripts executable..."
ssh "${SSH_TARGET}" "chmod +x /tmp/complete-502-fix.sh /tmp/full-production-diagnosis.sh" || true

# Ask user if they want to run the fix
echo ""
echo "=========================================="
echo "READY TO EXECUTE FIX"
echo "=========================================="
echo ""
echo "The fix script will:"
echo "  ✅ Create/verify all .env files"
echo "  ✅ Rebuild Docker containers"
echo "  ✅ Start all services"
echo "  ✅ Reload Nginx"
echo "  ✅ Verify everything is working"
echo ""
echo "This will take 15-20 minutes."
echo ""
read -p "Execute fix now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Executing fix on server..."
    echo "   (This will take 15-20 minutes)"
    echo ""
    
    # Run the fix script on server
    ssh "${SSH_TARGET}" "bash /tmp/complete-502-fix.sh" || {
        echo ""
        echo "❌ Fix script encountered errors"
        echo ""
        echo "Next steps:"
        echo "1. SSH to server: ssh ${SSH_TARGET}"
        echo "2. Check logs: cd /opt/smokava && docker compose logs"
        echo "3. Run diagnostic: bash /tmp/full-production-diagnosis.sh"
        exit 1
    }
    
    echo ""
    echo "=========================================="
    echo "✅ FIX COMPLETE"
    echo "=========================================="
    echo ""
    echo "Verifying domains..."
    sleep 5
    
    # Test domains
    for domain in "https://smokava.com" "https://api.smokava.com" "https://admin.smokava.com"; do
        HTTP_CODE=$(curl -f -s -o /dev/null -w "%{http_code}" --max-time 10 "${domain}" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
            echo "✅ ${domain} - HTTP ${HTTP_CODE}"
        else
            echo "❌ ${domain} - HTTP ${HTTP_CODE}"
        fi
    done
    
    echo ""
    echo "If domains still show 502, check:"
    echo "  ssh ${SSH_TARGET} 'cd /opt/smokava && docker compose ps'"
    echo "  ssh ${SSH_TARGET} 'cd /opt/smokava && docker compose logs --tail 50'"
    
else
    echo ""
    echo "Fix not executed."
    echo ""
    echo "To run manually:"
    echo "  ssh ${SSH_TARGET}"
    echo "  bash /tmp/complete-502-fix.sh"
    echo ""
    echo "Or if scripts are in git repo:"
    echo "  ssh ${SSH_TARGET}"
    echo "  cd /opt/smokava && git pull"
    echo "  bash scripts/complete-502-fix.sh"
fi

