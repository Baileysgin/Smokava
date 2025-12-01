require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createMiroUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava');
    console.log('✅ Connected to MongoDB');

    const phoneNumber = '09385008571';
    const username = 'miro';

    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { phoneNumber: phoneNumber },
        { username: username }
      ]
    });

    if (user) {
      console.log('ℹ️  User already exists:');
      console.log(`   Phone: ${user.phoneNumber}`);
      console.log(`   Username: ${user.username || 'not set'}`);
      console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''}`);

      // Update username if not set
      if (!user.username || user.username !== username) {
        user.username = username;
        await user.save();
        console.log(`✅ Updated username to: ${username}`);
      }

      // Update firstName if not set
      if (!user.firstName) {
        user.firstName = 'Miro';
        await user.save();
        console.log(`✅ Updated firstName to: Miro`);
      }
    } else {
      // Create new user
      user = new User({
        phoneNumber: phoneNumber,
        username: username,
        firstName: 'Miro',
        lastName: '',
        photoUrl: 'https://i.pravatar.cc/150?img=13',
        avatar: 'https://i.pravatar.cc/150?img=13',
        name: 'Miro', // Legacy field
        following: [],
        followers: [],
        createdAt: new Date()
      });

      await user.save();
      console.log('✅ Created Miro user:');
      console.log(`   Phone: ${phoneNumber}`);
      console.log(`   Username: ${username}`);
      console.log(`   Name: Miro`);
    }

    console.log('\n✅ Miro user is ready!');
    console.log(`   User ID: ${user._id}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating Miro user:', error);
    process.exit(1);
  }
}

createMiroUser();
