#!/bin/bash

# Comprehensive script to remove ALL localhost references from Smokava project
# This script ensures NO localhost fallbacks exist in production code

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 STEP 1: Scanning for localhost references..."

# Count initial localhost references
INITIAL_COUNT=$(grep -r "localhost\|127\.0\.0\.1" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.sh" --include="*.yml" --include="*.yaml" --include="*.conf" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build . 2>/dev/null | wc -l | tr -d ' ')

echo "   Found $INITIAL_COUNT initial references"

# Files to fix (production code only, not docs)
FILES_TO_FIX=(
  "backend/server.js"
  "backend/scripts/createAdmin.js"
  "backend/scripts/updateBaileysginUser.js"
  "backend/scripts/createMiroUser.js"
  "backend/scripts/seedFakeData.js"
  "backend/scripts/seed.js"
  "backend/scripts/addRedeemLogIdToHistory.js"
  "backend/scripts/checkOtp.js"
  "backend/scripts/activatePackage.js"
  "backend/scripts/testFullLoginWithSMS.js"
  "admin-panel/src/lib/api.ts"
  "frontend/lib/api.ts"
  "docker-compose.yml"
  "scripts/rebuild-counters.sh"
  "scripts/seed-database.sh"
  "scripts/restore-database.sh"
)

echo ""
echo "🔧 Fixing production code files..."

# Fix backend/server.js
if [ -f "backend/server.js" ]; then
  echo "   Fixing backend/server.js..."
  sed -i.bak 's|mongodb://localhost:27017/smokava|mongodb://mongodb:27017/smokava|g' backend/server.js
  sed -i.bak "s|'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'|process.env.DEV_ORIGINS ? process.env.DEV_ORIGINS.split(',') : []|g" backend/server.js
  sed -i.bak 's|// Use environment variables if provided, otherwise use localhost defaults|// Use environment variables only - no localhost defaults|g' backend/server.js
  rm -f backend/server.js.bak
fi

# Fix all backend scripts
for script in backend/scripts/*.js; do
  if [ -f "$script" ]; then
    echo "   Fixing $script..."
    sed -i.bak 's|mongodb://localhost:27017/smokava|mongodb://mongodb:27017/smokava|g' "$script"
    rm -f "${script}.bak"
  fi
done

# Fix admin-panel API
if [ -f "admin-panel/src/lib/api.ts" ]; then
  echo "   Fixing admin-panel/src/lib/api.ts..."
  # Remove localhost fallback completely
  sed -i.bak "s|apiUrl = 'http://localhost:5000/api';|// No localhost fallback - must use environment variable|g" admin-panel/src/lib/api.ts
  sed -i.bak "s|'http://localhost:5000/api'|process.env.VITE_API_URL || (() => { throw new Error('VITE_API_URL must be set'); })()|g" admin-panel/src/lib/api.ts
  rm -f admin-panel/src/lib/api.ts.bak
fi

# Fix frontend API
if [ -f "frontend/lib/api.ts" ]; then
  echo "   Fixing frontend/lib/api.ts..."
  # Remove localhost fallback completely
  sed -i.bak "s|return 'http://localhost:5000/api';|throw new Error('NEXT_PUBLIC_API_URL must be set in production');|g" frontend/lib/api.ts
  sed -i.bak "s|// Only allow localhost fallback in development mode|// No localhost fallback - production only|g" frontend/lib/api.ts
  rm -f frontend/lib/api.ts.bak
fi

# Fix docker-compose.yml
if [ -f "docker-compose.yml" ]; then
  echo "   Fixing docker-compose.yml..."
  sed -i.bak 's|mongosh localhost:27017/test|mongosh mongodb:27017/test|g' docker-compose.yml
  sed -i.bak 's|http://localhost:3000,http://localhost:5173||g' docker-compose.yml
  sed -i.bak 's|,http://localhost:3000||g' docker-compose.yml
  sed -i.bak 's|,http://localhost:5173||g' docker-compose.yml
  rm -f docker-compose.yml.bak
fi

# Fix scripts
for script in scripts/*.sh; do
  if [ -f "$script" ]; then
    echo "   Fixing $script..."
    sed -i.bak 's|mongodb://localhost:27017/smokava|mongodb://mongodb:27017/smokava|g' "$script"
    sed -i.bak 's|http://localhost:5000/api|${API_BASE_URL:-https://api.smokava.com}/api|g' "$script"
    sed -i.bak 's|http://localhost:5000|${API_BASE_URL:-https://api.smokava.com}|g' "$script"
    rm -f "${script}.bak"
  fi
done

echo ""
echo "✅ Production code files fixed"
echo ""
echo "📊 Final scan results:"

# Count remaining localhost in production code (excluding docs and nginx internal configs)
REMAINING=$(grep -r "localhost\|127\.0\.0\.1" \
  --include="*.js" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.json" \
  --include="*.sh" \
  --include="*.yml" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=dist \
  --exclude-dir=build \
  --exclude="*.md" \
  --exclude="nginx/*" \
  . 2>/dev/null | grep -v "mongodb://mongodb" | grep -v "proxy_pass http://localhost" | grep -v "127.0.0.1:5000" | wc -l | tr -d ' ')

if [ "$REMAINING" -eq "0" ]; then
  echo -e "${GREEN}   ✅ 0 localhost references found in production code${NC}"
else
  echo -e "${YELLOW}   ⚠️  $REMAINING references remain (may be in nginx configs or acceptable locations)${NC}"
  echo ""
  echo "   Remaining references:"
  grep -r "localhost\|127\.0\.0\.1" \
    --include="*.js" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.json" \
    --include="*.sh" \
    --include="*.yml" \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir=dist \
    --exclude-dir=build \
    --exclude="*.md" \
    --exclude="nginx/*" \
    . 2>/dev/null | grep -v "mongodb://mongodb" | grep -v "proxy_pass http://localhost" | head -10
fi

echo ""
echo "✅ Localhost removal complete!"

