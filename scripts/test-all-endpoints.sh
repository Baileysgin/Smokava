#!/bin/bash

# Comprehensive testing script for Admin, Operator, and User endpoints

set -e

API_URL="${API_BASE_URL:-https://api.smokava.com}"
if [[ ! "$API_URL" == */api ]]; then
    API_URL="${API_URL%/}/api"
fi

echo "🧪 Testing Smokava API Endpoints"
echo "================================="
echo ""
echo "API URL: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${API_URL}/health" 2>&1)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}   ✅ Health check passed${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}   ❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 2: Admin Login
echo -e "${YELLOW}2. Testing Admin Login...${NC}"
ADMIN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_URL}/admin/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' 2>&1)
ADMIN_HTTP_CODE=$(echo "$ADMIN_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
ADMIN_BODY=$(echo "$ADMIN_RESPONSE" | grep -v "HTTP_CODE:")

if [ "$ADMIN_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}   ✅ Admin login successful${NC}"
    ADMIN_TOKEN=$(echo "$ADMIN_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null || echo "")
    if [ -n "$ADMIN_TOKEN" ]; then
        echo "   Token received: ${ADMIN_TOKEN:0:20}..."
        export ADMIN_TOKEN
    fi
else
    echo -e "${RED}   ❌ Admin login failed (HTTP $ADMIN_HTTP_CODE)${NC}"
    echo "$ADMIN_BODY"
fi
echo ""

# Test 3: Admin Dashboard (if token available)
if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${YELLOW}3. Testing Admin Dashboard...${NC}"
    DASHBOARD_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${API_URL}/admin/dashboard/stats" \
        -H "Authorization: Bearer $ADMIN_TOKEN" 2>&1)
    DASHBOARD_HTTP_CODE=$(echo "$DASHBOARD_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    DASHBOARD_BODY=$(echo "$DASHBOARD_RESPONSE" | grep -v "HTTP_CODE:")

    if [ "$DASHBOARD_HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}   ✅ Admin dashboard accessible${NC}"
        echo "$DASHBOARD_BODY" | python3 -m json.tool 2>/dev/null | head -10 || echo "$DASHBOARD_BODY"
    else
        echo -e "${RED}   ❌ Admin dashboard failed (HTTP $DASHBOARD_HTTP_CODE)${NC}"
        echo "$DASHBOARD_BODY"
    fi
    echo ""
fi

# Test 4: User OTP Send
echo -e "${YELLOW}4. Testing User OTP Send...${NC}"
OTP_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_URL}/auth/send-otp" \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"09302593819"}' 2>&1)
OTP_HTTP_CODE=$(echo "$OTP_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
OTP_BODY=$(echo "$OTP_RESPONSE" | grep -v "HTTP_CODE:")

if [ "$OTP_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}   ✅ OTP send successful${NC}"
    echo "$OTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$OTP_BODY"
else
    echo -e "${RED}   ❌ OTP send failed (HTTP $OTP_HTTP_CODE)${NC}"
    echo "$OTP_BODY"
fi
echo ""

# Test 5: Operator Endpoints (if exists)
echo -e "${YELLOW}5. Testing Operator Endpoints...${NC}"
OPERATOR_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${API_URL}/operator" 2>&1)
OPERATOR_HTTP_CODE=$(echo "$OPERATOR_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$OPERATOR_HTTP_CODE" = "401" ] || [ "$OPERATOR_HTTP_CODE" = "404" ]; then
    echo -e "${YELLOW}   ⚠️  Operator endpoint requires authentication or doesn't exist${NC}"
else
    echo -e "${GREEN}   ✅ Operator endpoint accessible${NC}"
fi
echo ""

# Test 6: Public Endpoints
echo -e "${YELLOW}6. Testing Public Endpoints...${NC}"

# Restaurants
RESTAURANTS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${API_URL}/restaurants" 2>&1)
RESTAURANTS_HTTP_CODE=$(echo "$RESTAURANTS_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
if [ "$RESTAURANTS_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}   ✅ Restaurants endpoint works${NC}"
else
    echo -e "${RED}   ❌ Restaurants endpoint failed (HTTP $RESTAURANTS_HTTP_CODE)${NC}"
fi

# Packages
PACKAGES_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${API_URL}/packages" 2>&1)
PACKAGES_HTTP_CODE=$(echo "$PACKAGES_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
if [ "$PACKAGES_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}   ✅ Packages endpoint works${NC}"
else
    echo -e "${RED}   ❌ Packages endpoint failed (HTTP $PACKAGES_HTTP_CODE)${NC}"
fi
echo ""

echo "=== Test Summary ==="
echo "✅ Health: $([ "$HTTP_CODE" = "200" ] && echo "PASS" || echo "FAIL")"
echo "✅ Admin Login: $([ "$ADMIN_HTTP_CODE" = "200" ] && echo "PASS" || echo "FAIL")"
echo "✅ OTP Send: $([ "$OTP_HTTP_CODE" = "200" ] && echo "PASS" || echo "FAIL")"
echo "✅ Public Endpoints: $([ "$RESTAURANTS_HTTP_CODE" = "200" ] && [ "$PACKAGES_HTTP_CODE" = "200" ] && echo "PASS" || echo "FAIL")"
