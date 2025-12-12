#!/bin/bash

# Script to fix admin user on production server
# Run this on the server: bash scripts/fix-admin-production.sh

echo "🔧 Fixing Admin User on Production Server"
echo "=========================================="
echo ""

cd /opt/smokava || exit 1

echo "Step 1: Checking if admin exists..."
docker compose exec -T backend node -e "
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava').then(async () => {
  const admin = await Admin.findOne({ username: 'admin' });
  if (admin) {
    console.log('✅ Admin exists');
    console.log('   ID:', admin._id);
    console.log('   Created:', admin.createdAt);
  } else {
    console.log('❌ Admin does NOT exist - will create now');
  }
  process.exit(0);
}).catch(err => { console.error('Error:', err.message); process.exit(1); });
"

echo ""
echo "Step 2: Creating/Updating admin user with password 'Admin#12345'..."
docker compose exec -T backend node -e "
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava').then(async () => {
  let admin = await Admin.findOne({ username: 'admin' });
  if (admin) {
    console.log('✅ Admin exists, updating password...');
    admin.password = 'Admin#12345';
    await admin.save();
    console.log('✅ Password updated successfully');
  } else {
    console.log('✅ Creating new admin user...');
    admin = new Admin({ username: 'admin', password: 'Admin#12345' });
    await admin.save();
    console.log('✅ Admin created successfully');
  }
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
"

echo ""
echo "Step 3: Verifying admin was created/updated..."
docker compose exec -T backend node -e "
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava').then(async () => {
  const admin = await Admin.findOne({ username: 'admin' });
  if (admin) {
    console.log('✅ Admin verified');
    console.log('   Username:', admin.username);
    console.log('   ID:', admin._id);
  } else {
    console.log('❌ Admin still does not exist');
    process.exit(1);
  }
  process.exit(0);
}).catch(err => { console.error('Error:', err.message); process.exit(1); });
"

echo ""
echo "✅ Done! Try logging in with:"
echo "   Username: admin"
echo "   Password: Admin#12345"
