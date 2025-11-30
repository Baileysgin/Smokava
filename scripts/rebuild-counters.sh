#!/bin/bash

# Rebuild Counters Script
# This script calls the admin API to rebuild user counters

set -e

API_URL="${API_URL:-http://localhost:5000/api}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

if [ -z "$ADMIN_TOKEN" ]; then
    echo "ERROR: ADMIN_TOKEN environment variable is required"
    exit 1
fi

echo "Rebuilding counters..."
curl -X POST "$API_URL/admin/rebuild-counters" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json"

echo ""
echo "Counters rebuild completed"

