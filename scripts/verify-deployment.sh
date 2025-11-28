#!/bin/bash

# ===========================================
# SMOKAVA - DEPLOYMENT VERIFICATION SCRIPT
# ===========================================
# This script verifies that all hardcoded URLs have been replaced

set -e

echo "🔍 Verifying deployment configuration..."
echo ""

ERRORS=0

# Check for hardcoded localhost URLs (excluding acceptable fallbacks)
echo "Checking for hardcoded localhost URLs..."
# Acceptable patterns:
# - Fallbacks after || or ? :
# - Development-only arrays (NODE_ENV === 'development')
# - In comments or documentation

PROBLEMATIC_MATCHES=$(grep -r "http://localhost" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist \
  frontend/ admin-panel/ backend/ 2>/dev/null | \
  grep -v ".env.example" | grep -v "env.example" | \
  grep -v "NODE_ENV === 'development'" | \
  grep -v "process.env.NODE_ENV !== 'production'" | \
  grep -vE "\|\|.*localhost|\\?.*localhost|:.*localhost" | \
  grep -v "^[[:space:]]*//" | \
  grep -v "^[[:space:]]*\*" | wc -l)

if [ "$PROBLEMATIC_MATCHES" -gt 0 ]; then
  echo "⚠️  Found potential hardcoded localhost URLs (check if they're fallbacks):"
  grep -r "http://localhost" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist \
    frontend/ admin-panel/ backend/ 2>/dev/null | \
    grep -v ".env.example" | grep -v "env.example" | \
    grep -v "NODE_ENV === 'development'" | \
    grep -v "process.env.NODE_ENV !== 'production'" | \
    grep -vE "\|\|.*localhost|\\?.*localhost|:.*localhost" | \
    grep -v "^[[:space:]]*//" | \
    grep -v "^[[:space:]]*\*" || true
  echo "ℹ️  Note: Fallback values (after || or ? :) are acceptable"
else
  echo "✅ No problematic hardcoded localhost URLs found"
fi

# Check for hardcoded IP addresses
echo ""
echo "Checking for hardcoded IP addresses..."
IP_MATCHES=$(grep -r "91.107.241.245\|127.0.0.1" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist \
  frontend/ admin-panel/ backend/ 2>/dev/null | grep -v ".env.example" | grep -v "env.example" | grep -v "CI_CD_SETUP.md" | wc -l)

if [ "$IP_MATCHES" -gt 0 ]; then
  echo "❌ Found hardcoded IP addresses:"
  grep -r "91.107.241.245\|127.0.0.1" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist \
    frontend/ admin-panel/ backend/ 2>/dev/null | grep -v ".env.example" | grep -v "env.example" | grep -v "CI_CD_SETUP.md" || true
  ERRORS=$((ERRORS + 1))
else
  echo "✅ No hardcoded IP addresses found"
fi

# Check for environment variable usage
echo ""
echo "Checking environment variable usage..."

# Check frontend API URL
if grep -q "process.env.NEXT_PUBLIC_API_URL" frontend/lib/api.ts; then
  echo "✅ Frontend uses NEXT_PUBLIC_API_URL"
else
  echo "❌ Frontend does not use NEXT_PUBLIC_API_URL"
  ERRORS=$((ERRORS + 1))
fi

# Check admin panel API URL
if grep -q "import.meta.env.VITE_API_URL" admin-panel/src/lib/api.ts; then
  echo "✅ Admin panel uses VITE_API_URL"
else
  echo "❌ Admin panel does not use VITE_API_URL"
  ERRORS=$((ERRORS + 1))
fi

# Check backend CORS
if grep -q "process.env.FRONTEND_URL\|process.env.ALLOWED_ORIGINS" backend/server.js; then
  echo "✅ Backend uses environment variables for CORS"
else
  echo "❌ Backend does not use environment variables for CORS"
  ERRORS=$((ERRORS + 1))
fi

# Check for .env.example files
echo ""
echo "Checking for .env.example files..."
if [ -f "env.example" ]; then
  echo "✅ Root env.example exists"
else
  echo "❌ Root env.example missing"
  ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "=========================================="
if [ "$ERRORS" -eq 0 ]; then
  echo "✅ All checks passed! Deployment ready."
  exit 0
else
  echo "❌ Found $ERRORS issue(s). Please fix before deploying."
  exit 1
fi
