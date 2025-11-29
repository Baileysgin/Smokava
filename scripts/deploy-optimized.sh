#!/bin/bash

# ===========================================
# DEPLOY OPTIMIZED ADMIN PANEL
# ===========================================
# This script rebuilds and deploys the optimized admin panel

set -e

echo "🚀 Deploying optimized admin panel..."

# Check if we're in the right directory
if [ ! -d "admin-panel" ]; then
    echo "❌ Error: admin-panel directory not found"
    exit 1
fi

cd admin-panel

# Install dependencies (including new compression plugin)
echo "📦 Installing dependencies..."
npm install

# Build with optimizations
echo "🔨 Building optimized admin panel..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build complete!"
echo ""
echo "📊 Build output:"
du -sh dist/
echo ""
echo "📦 Compressed files:"
find dist -name "*.gz" -o -name "*.br" | head -10
echo ""
echo "📋 Next steps:"
echo "1. Copy dist/ to server: /var/www/smokava-admin-panel/"
echo "2. Update Nginx config on server"
echo "3. Restart backend to enable compression and caching"
echo ""
echo "To deploy to server:"
echo "  scp -r dist/* root@91.107.241.245:/var/www/smokava-admin-panel/"
echo "  ssh root@91.107.241.245 'sudo chown -R www-data:www-data /var/www/smokava-admin-panel && sudo systemctl reload nginx'"

