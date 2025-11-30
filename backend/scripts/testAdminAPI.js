require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('../models/Package');
const Admin = require('../models/Admin');

async function testAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava');
    console.log('✅ Connected to MongoDB\n');

    // Check packages
    const packages = await Package.find().sort({ createdAt: -1 });
    console.log(`📦 Packages in database: ${packages.length}`);
    packages.forEach((pkg, i) => {
      console.log(`   ${i + 1}. ${pkg.nameFa} (${pkg.count} عدد) - ID: ${pkg._id}`);
    });
    console.log('');

    // Check admin
    const admin = await Admin.findOne();
    if (admin) {
      console.log(`👤 Admin found: ${admin.username}`);
      console.log(`   ID: ${admin._id}`);
    } else {
      console.log('❌ No admin found');
    }
    console.log('');

    // Test the route logic directly
    console.log('🧪 Testing route logic...');
    const testPackages = await Package.find().sort({ createdAt: -1 });
    console.log(`✅ Route would return ${testPackages.length} packages`);
    console.log('   Sample response:', JSON.stringify({
      _id: testPackages[0]._id,
      nameFa: testPackages[0].nameFa,
      count: testPackages[0].count,
      price: testPackages[0].price
    }, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAPI();
