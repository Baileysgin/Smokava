#!/bin/bash

# Database Recovery Script
# This script recovers essential data after a data loss incident

set -e

echo "🔄 Database Recovery Script"
echo ""

# Server details (if running remotely)
SERVER="${SERVER:-}"
REMOTE_DIR="/opt/smokava"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run command locally or remotely
run_cmd() {
    local cmd="$1"
    if [ -n "$SERVER" ]; then
        sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SERVER" "cd $REMOTE_DIR && $cmd"
    else
        eval "$cmd"
    fi
}

echo "📊 Step 1: Checking current database state..."
run_cmd "docker exec smokava-mongodb mongosh smokava --quiet --eval 'db.getCollectionNames().forEach(c => print(c + \": \" + db[c].countDocuments()))'"

echo ""
echo "🔍 Step 2: Checking for suspicious databases..."
run_cmd "docker exec smokava-mongodb mongosh --quiet --eval 'db.adminCommand(\"listDatabases\").databases.forEach(d => print(d.name))'"

echo ""
echo "🛡️ Step 3: Removing suspicious database (if exists)..."
run_cmd "docker exec smokava-mongodb mongosh --quiet --eval 'db.getSiblingDB(\"READ__ME_TO_RECOVER_YOUR_DATA\").dropDatabase()' 2>/dev/null || echo 'Suspicious database not found or already removed'"

echo ""
echo "👤 Step 4: Recreating admin user..."
run_cmd "docker exec smokava-backend node scripts/createAdmin.js admin admin123"

echo ""
echo "📦 Step 5: Seeding packages and restaurants..."
run_cmd "docker exec smokava-backend node scripts/seed.js"

echo ""
echo "✅ Step 6: Verifying recovery..."
run_cmd "docker exec smokava-mongodb mongosh smokava --quiet --eval 'print(\"Users: \" + db.users.countDocuments()); print(\"Packages: \" + db.packages.countDocuments()); print(\"Restaurants: \" + db.restaurants.countDocuments()); print(\"Admins: \" + db.admins.countDocuments());'"

echo ""
echo -e "${GREEN}✅ Database recovery complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Test admin login: https://admin.smokava.com"
echo "2. Verify packages and restaurants are visible"
echo "3. Set up automated backups to prevent future data loss"
echo "4. Review server security (ransomware attack detected)"

