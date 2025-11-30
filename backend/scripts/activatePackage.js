require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Package = require('../models/Package');
const UserPackage = require('../models/UserPackage');

const activatePackage = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava');
    console.log('✅ MongoDB connected');

    const phoneNumber = process.argv[2] || '09385008571';
    const packageId = process.argv[3]; // Optional: specific package ID

    console.log(`\n📱 Activating package for phone: ${phoneNumber}`);

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      console.log(`👤 User not found, creating new user...`);
      user = new User({ phoneNumber });
      await user.save();
      console.log(`✅ User created: ${user._id}`);
    } else {
      console.log(`✅ User found: ${user._id}`);
    }

    // Get package
    let package;
    if (packageId) {
      package = await Package.findById(packageId);
      if (!package) {
        console.log(`❌ Package with ID ${packageId} not found`);
        process.exit(1);
      }
    } else {
      // Get first available package (prefer popular or first one)
      package = await Package.findOne().sort({ badge: -1, _id: 1 });
      if (!package) {
        console.log(`❌ No packages found in database`);
        process.exit(1);
      }
    }

    console.log(`📦 Using package: ${package.nameFa} (${package.count} count)`);

    // Check if user already has an active package
    const existingPackage = await UserPackage.findOne({
      user: user._id,
      package: package._id,
      status: 'active',
      remainingCount: { $gt: 0 }
    });

    if (existingPackage) {
      console.log(`⚠️  User already has an active package with ${existingPackage.remainingCount} remaining`);
      console.log(`   Package ID: ${existingPackage._id}`);
      console.log(`   Total: ${existingPackage.totalCount}, Remaining: ${existingPackage.remainingCount}`);

      const update = process.argv[4] === '--force';
      if (!update) {
        console.log(`\n   Use --force to create a new package anyway`);
        process.exit(0);
      }
      console.log(`\n   Creating new package anyway (--force flag used)...`);
    }

    // Create user package
    const userPackage = new UserPackage({
      user: user._id,
      package: package._id,
      totalCount: package.count,
      remainingCount: package.count,
      status: 'active',
      purchasedAt: new Date()
    });

    await userPackage.save();

    console.log(`\n✅ Package activated successfully!`);
    console.log(`\n📋 Package Details:`);
    console.log(`   User: ${phoneNumber}`);
    console.log(`   Package: ${package.nameFa} (${package.count} count)`);
    console.log(`   Total Count: ${userPackage.totalCount}`);
    console.log(`   Remaining Count: ${userPackage.remainingCount}`);
    console.log(`   Status: ${userPackage.status}`);
    console.log(`   Package ID: ${userPackage._id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error activating package:', error);
    process.exit(1);
  }
};

activatePackage();
