require('dotenv').config();
const mongoose = require('mongoose');
const UserPackage = require('../models/UserPackage');
const Package = require('../models/Package');
const User = require('../models/User');

async function activatePackageForUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava');
    console.log('✅ Connected to MongoDB');

    // Get phone number from command line argument or use default
    const phoneNumber = process.argv[2] || '09302593819';
    console.log(`🔍 Looking for user with phone number: ${phoneNumber}`);

    // Find user by phone number
    let user = await User.findOne({ phoneNumber });

    if (!user) {
      console.log('❌ User not found. Available users:');
      const allUsers = await User.find({}).limit(10);
      allUsers.forEach(u => {
        console.log(`  - ID: ${u._id}, Name: ${u.name || 'N/A'}, Phone: ${u.phoneNumber || 'N/A'}`);
      });
      process.exit(1);
    }
    console.log(`✅ Found user: ${user.name || 'N/A'} (${user.phoneNumber}) - ID: ${user._id}`);

    // Get first package
    const package = await Package.findOne();
    if (!package) {
      console.log('❌ No packages found. Please create a package first.');
      process.exit(1);
    }
    console.log(`✅ Found package: ${package.nameFa} (${package.count} items, ${package.price} Toman)`);

    // Check if user already has this package
    let userPackage = await UserPackage.findOne({
      user: user._id,
      package: package._id
    });

    if (userPackage) {
      // Update existing package
      userPackage.status = 'active';
      userPackage.remainingCount = userPackage.totalCount;
      await userPackage.save();
      console.log(`✅ Updated existing package - Status: active, Remaining: ${userPackage.remainingCount}`);
    } else {
      // Create new user package
      userPackage = new UserPackage({
        user: user._id,
        package: package._id,
        totalCount: package.count,
        remainingCount: package.count,
        status: 'active'
      });
      await userPackage.save();
      console.log(`✅ Created new package - Status: active, Remaining: ${userPackage.remainingCount}`);
    }

    console.log('\n🎉 Package activated successfully!');
    console.log(`User: ${user.name || user.phoneNumber} (${user._id})`);
    console.log(`Package: ${package.nameFa}`);
    console.log(`Remaining count: ${userPackage.remainingCount}/${userPackage.totalCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

activatePackageForUser();
