#!/bin/bash

# Pre-Deploy Health Check Script
# Validates all configurations before deployment

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PRE-DEPLOY HEALTH CHECK${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check and report
check_pass() {
  echo -e "${GREEN}[OK]${NC} $1"
}

check_fail() {
  echo -e "${RED}[FAIL]${NC} $1"
  ERRORS=$((ERRORS + 1))
}

check_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}

# STEP 1: Scan for localhost references
echo -e "${BLUE}STEP 1: Scanning for localhost references...${NC}"
LOCALHOST_COUNT=$(grep -r "localhost\|127\.0\.0\.1" \
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

if [ "$LOCALHOST_COUNT" -eq "0" ]; then
  check_pass "No localhost references in production code"
else
  check_fail "Found $LOCALHOST_COUNT localhost references"
  echo "   Files with localhost:"
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
    . 2>/dev/null | grep -v "mongodb://mongodb" | grep -v "proxy_pass http://localhost" | head -5 | sed 's/^/     /'
fi
echo ""

# STEP 2: Check environment variables
echo -e "${BLUE}STEP 2: Checking environment configuration...${NC}"

# Check if .env files exist
if [ -f ".env" ]; then
  if grep -q "localhost\|127\.0\.0\.1" .env 2>/dev/null; then
    check_fail ".env file contains localhost references"
  else
    check_pass ".env file has no localhost references"
  fi
else
  check_warn ".env file not found (may be using environment variables)"
fi

# Check required environment variables in docker-compose
if grep -q "API_BASE_URL" docker-compose.yml 2>/dev/null; then
  check_pass "API_BASE_URL configured in docker-compose.yml"
else
  check_warn "API_BASE_URL not found in docker-compose.yml"
fi

if grep -q "MONGODB_URI.*mongodb://mongodb" docker-compose.yml 2>/dev/null; then
  check_pass "MongoDB URI uses Docker service name (mongodb)"
else
  check_fail "MongoDB URI may not be configured correctly"
fi
echo ""

# STEP 3: Test HTTPS connectivity
echo -e "${BLUE}STEP 3: Testing HTTPS connectivity...${NC}"

test_url() {
  local url=$1
  local name=$2
  if curl -I -s --max-time 10 "$url" > /dev/null 2>&1; then
    check_pass "$name is reachable ($url)"
  else
    check_warn "$name is not reachable ($url) - may be normal if not deployed yet"
  fi
}

test_url "https://api.smokava.com/health" "API Health Endpoint"
test_url "https://smokava.com" "Frontend"
test_url "https://admin.smokava.com" "Admin Panel"
echo ""

# STEP 4: Validate Docker configuration
echo -e "${BLUE}STEP 4: Validating Docker configuration...${NC}"

if command -v docker-compose > /dev/null 2>&1 || command -v docker > /dev/null 2>&1; then
  check_pass "Docker is available"

  # Check docker-compose.yml syntax
  if docker-compose config > /dev/null 2>&1 || docker compose config > /dev/null 2>&1; then
    check_pass "docker-compose.yml syntax is valid"
  else
    check_fail "docker-compose.yml has syntax errors"
  fi

  # Check for localhost port mappings in production
  if grep -q "localhost:.*:" docker-compose.yml 2>/dev/null; then
    check_warn "docker-compose.yml may contain localhost port mappings (check if needed)"
  else
    check_pass "No localhost port mappings found"
  fi
else
  check_warn "Docker not available (may be running on server)"
fi
echo ""

# STEP 5: Validate GitHub connection
echo -e "${BLUE}STEP 5: Validating GitHub connection...${NC}"

if git remote -v | grep -q "github.com" 2>/dev/null; then
  check_pass "GitHub remote is configured"

  # Check if we can reach GitHub
  if git ls-remote --heads origin main > /dev/null 2>&1; then
    check_pass "GitHub repository is accessible"
  else
    check_fail "Cannot access GitHub repository (check SSH keys or token)"
  fi

  # Check current branch
  CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
  if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    check_pass "On main/master branch ($CURRENT_BRANCH)"
  else
    check_warn "Not on main/master branch (current: $CURRENT_BRANCH)"
  fi
else
  check_fail "GitHub remote not configured"
fi
echo ""

# STEP 6: Check GitHub Actions workflow
echo -e "${BLUE}STEP 6: Checking GitHub Actions workflow...${NC}"

if [ -f ".github/workflows/deploy.yml" ]; then
  check_pass "GitHub Actions workflow file exists"

  # Check for required secrets
  if grep -q "secrets.SSH_PRIVATE_KEY" .github/workflows/deploy.yml 2>/dev/null; then
    check_pass "Workflow uses SSH_PRIVATE_KEY secret"
  else
    check_warn "Workflow may not be using SSH_PRIVATE_KEY"
  fi

  if grep -q "secrets.SSH_HOST" .github/workflows/deploy.yml 2>/dev/null; then
    check_pass "Workflow uses SSH_HOST secret"
  else
    check_warn "Workflow may not be using SSH_HOST"
  fi

  # Check permissions
  if grep -q "permissions:" .github/workflows/deploy.yml 2>/dev/null; then
    check_pass "Workflow has permissions configured"
  else
    check_warn "Workflow may need permissions section"
  fi
else
  check_fail "GitHub Actions workflow file not found"
fi
echo ""

# STEP 7: Check API client configurations
echo -e "${BLUE}STEP 7: Checking API client configurations...${NC}"

# Check frontend API (ignore comments)
if [ -f "frontend/lib/api.ts" ]; then
  if grep -v "//.*localhost\|No localhost" frontend/lib/api.ts 2>/dev/null | grep -q "localhost"; then
    check_fail "frontend/lib/api.ts contains localhost (non-comment)"
  else
    check_pass "frontend/lib/api.ts has no localhost references (excluding comments)"
  fi
fi

# Check admin-panel API (ignore comments)
if [ -f "admin-panel/src/lib/api.ts" ]; then
  if grep -v "//.*localhost\|No localhost" admin-panel/src/lib/api.ts 2>/dev/null | grep -q "localhost"; then
    check_fail "admin-panel/src/lib/api.ts contains localhost (non-comment)"
  else
    check_pass "admin-panel/src/lib/api.ts has no localhost references (excluding comments)"
  fi
fi
echo ""

# Final Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  HEALTH CHECK SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found, but no critical errors.${NC}"
  echo -e "${GREEN}✅ Ready for deployment with warnings.${NC}"
  exit 0
else
  echo -e "${RED}❌ $ERRORS error(s) and $WARNINGS warning(s) found.${NC}"
  echo -e "${RED}❌ FIX REQUIRED before deployment!${NC}"
  exit 1
fi
