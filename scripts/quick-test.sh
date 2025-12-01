#!/bin/bash

# Quick test to check admin panel status

echo "Testing admin.smokava.com..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 -k https://admin.smokava.com 2>/dev/null || echo "000")

echo "HTTP Status Code: $HTTP_CODE"

case "$HTTP_CODE" in
    200)
        echo "✅ SUCCESS - Admin panel is working!"
        ;;
    301|302)
        echo "✅ SUCCESS - Redirect working (might need to follow redirect)"
        ;;
    404)
        echo "⚠️  WARNING - Page not found (but server is responding)"
        ;;
    502)
        echo "❌ FAILED - 502 Bad Gateway (container not running or nginx can't connect)"
        echo ""
        echo "Run this on your server to fix:"
        echo "  cd /opt/smokava && git pull && sudo bash scripts/fix-502-ultimate.sh"
        ;;
    503)
        echo "❌ FAILED - 503 Service Unavailable"
        ;;
    000)
        echo "❌ FAILED - Connection timeout or refused"
        ;;
    *)
        echo "⚠️  Unexpected status: $HTTP_CODE"
        ;;
esac

