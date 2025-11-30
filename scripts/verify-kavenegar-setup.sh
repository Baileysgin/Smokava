#!/bin/bash

echo "🔍 Verifying Kavenegar Setup..."
echo ""

# Check backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env file not found!"
    exit 1
fi

echo "✅ backend/.env file exists"

# Check API key is set
if grep -q "KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D" backend/.env; then
    echo "✅ KAVENEGAR_API_KEY is configured"
else
    echo "❌ KAVENEGAR_API_KEY not found or incorrect"
    exit 1
fi

# Check template is set
if grep -q "KAVENEGAR_TEMPLATE=otp-v2" backend/.env; then
    echo "✅ KAVENEGAR_TEMPLATE is configured (otp-v2)"
else
    echo "❌ KAVENEGAR_TEMPLATE not found or incorrect"
    exit 1
fi

# Check NODE_ENV
if grep -q "NODE_ENV=production" backend/.env; then
    echo "✅ NODE_ENV is set to production"
else
    echo "⚠️  NODE_ENV is not set to production (this is OK for testing)"
fi

# Check test script exists
if [ -f "backend/scripts/testKavenegar.js" ]; then
    echo "✅ Test script exists (backend/scripts/testKavenegar.js)"
else
    echo "❌ Test script not found"
    exit 1
fi

# Check kavenegar service file
if [ -f "backend/services/kavenegar.js" ]; then
    echo "✅ Kavenegar service file exists"
else
    echo "❌ Kavenegar service file not found"
    exit 1
fi

echo ""
echo "✅ All checks passed! Kavenegar is configured correctly."
echo ""
echo "📋 Next steps:"
echo "   1. Restart your backend server"
echo "   2. Test OTP from frontend: https://smokava.com/auth"
echo "   3. Check backend logs for SMS status"
echo ""



