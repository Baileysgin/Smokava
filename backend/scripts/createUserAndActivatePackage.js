require('dotenv').config();
const mongoose = require('mongoose');
const UserPackage = require('../models/UserPackage');
const Package = require('../models/Package');
const User = require('../models/User');

async function createUserAndActivatePackage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava');
    console.log('✅ Connected to MongoDB');

    // Find or create user
    let user = await User.findOne({ username: 'User_d88495' });
    if (!user) {
      // Try to find by phone number pattern
      user = await User.findOne({ phoneNumber: /d88495/i });
    }

    if (!user) {
      // Create new user
      user = new User({
        username: 'User_d88495',
        name: 'User_d88495',
        phoneNumber: '0912d88495',
        firstName: 'User',
        lastName: 'd88495'
      });
      await user.save();
      console.log(`✅ Created new user: ${user.username} (${user.phoneNumber}) - ID: ${user._id}`);
    } else {
      console.log(`✅ Found existing user: ${user.username || user.name} (${user.phoneNumber}) - ID: ${user._id}`);
    }

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
    console.log(`User: ${user.username || user.name || user.phoneNumber} (${user._id})`);
    console.log(`Package: ${package.nameFa}`);
    console.log(`Remaining count: ${userPackage.remainingCount}/${userPackage.totalCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createUserAndActivatePackage();


