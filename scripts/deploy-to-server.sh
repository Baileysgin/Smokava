#!/bin/bash

# ⚠️  DEPRECATED: This script is deprecated
# 
# DO NOT USE THIS SCRIPT FOR DIRECT DEPLOYMENT
# 
# Instead, use this workflow:
# 1. Push code to GitHub: ./scripts/push-to-git.sh
# 2. Deploy on server by pulling from git:
#    ssh user@server "cd /opt/smokava && git pull && bash scripts/deploy.sh"
# 
# Or use GitHub Actions CI/CD for automatic deployment
#
# This script is kept for reference only and should not be used.

echo "⚠️  WARNING: This script is deprecated!"
echo ""
echo "Please use the recommended workflow:"
echo "  1. Push to git: ./scripts/push-to-git.sh"
echo "  2. Deploy on server: ssh user@server 'cd /opt/smokava && git pull && bash scripts/deploy.sh'"
echo ""
echo "Aborting direct server deployment..."
exit 1
