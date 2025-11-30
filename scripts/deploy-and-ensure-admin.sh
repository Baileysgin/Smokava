#!/bin/bash

# Deployment script that ensures admin user exists after deployment

set -e

echo "🚀 Deploying Smokava and ensuring admin user..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found${NC}"
    exit 1
fi

# Step 1: Pull latest code
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull origin main || echo -e "${YELLOW}⚠️  Git pull failed, continuing...${NC}"

# Step 2: Create backup
echo -e "${YELLOW}📦 Creating backup...${NC}"
if [ -f "scripts/db-backup.sh" ]; then
    bash scripts/db-backup.sh || echo -e "${YELLOW}⚠️  Backup failed, continuing...${NC}"
fi

# Step 3: Deploy services
echo -e "${YELLOW}🔨 Building and deploying services...${NC}"
docker-compose build backend
docker-compose up -d --no-deps backend

# Step 4: Wait for services
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Step 5: Ensure admin user exists
echo -e "${YELLOW}👤 Ensuring admin user exists...${NC}"
docker-compose exec -T backend node scripts/createAdmin.js admin admin123 || {
    echo -e "${YELLOW}⚠️  Admin creation had issues, but continuing...${NC}"
}

# Step 6: Verify admin user
echo -e "${YELLOW}✅ Verifying admin user...${NC}"
docker-compose exec -T backend node -e "
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava')
  .then(async () => {
    const admin = await Admin.findOne({ username: 'admin' });
    if (admin) {
      console.log('✅ Admin user verified!');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('❌ Admin user not found');
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });
" 2>&1 | grep -v "level=warning"

# Step 7: Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
API_URL="${API_BASE_URL:-https://api.smokava.com}"
if [[ ! "$API_URL" == */api ]]; then
    API_URL="${API_URL%/}/api"
fi

if curl -f "${API_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed, but services may still be starting${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${GREEN}Admin Login Credentials:${NC}"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${YELLOW}⚠️  Change password after first login!${NC}"
