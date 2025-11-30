require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function updateBaileysginUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smokava');
    console.log('✅ Connected to MongoDB');

    const phoneNumber = '09302593819';
    const username = 'baileysgin';
    const firstName = 'Baileysgin';

    // Find user by phone number
    let user = await User.findOne({ phoneNumber: phoneNumber });

    if (!user) {
      console.log('❌ User not found with phone number:', phoneNumber);
      console.log('   Creating new user...');
      
      user = new User({
        phoneNumber: phoneNumber,
        username: username,
        firstName: firstName,
        lastName: '',
        photoUrl: 'https://i.pravatar.cc/150?img=12',
        avatar: 'https://i.pravatar.cc/150?img=12',
        name: firstName, // Legacy field
        following: [],
        followers: [],
        createdAt: new Date()
      });
      
      await user.save();
      console.log('✅ Created new Baileysgin user');
    } else {
      console.log('✅ Found existing user:');
      console.log(`   Current username: ${user.username || 'not set'}`);
      console.log(`   Current name: ${user.firstName || ''} ${user.lastName || ''}`);
      
      // Update username if not set or different
      if (!user.username || user.username !== username) {
        // Check if username is already taken by another user
        const existingUserWithUsername = await User.findOne({ 
          username: username,
          _id: { $ne: user._id }
        });
        
        if (existingUserWithUsername) {
          console.log(`⚠️  Username '${username}' is already taken by another user`);
          console.log(`   Removing username from the other user and assigning to this user...`);
          
          // Remove username from the other user (likely seed data)
          existingUserWithUsername.username = undefined;
          await existingUserWithUsername.save();
          console.log(`✅ Removed username from other user (${existingUserWithUsername.phoneNumber})`);
        }
        
        user.username = username;
        console.log(`✅ Updated username to: ${username}`);
      }
      
      // Update firstName if not set or different
      if (!user.firstName || user.firstName !== firstName) {
        user.firstName = firstName;
        console.log(`✅ Updated firstName to: ${firstName}`);
      }
      
      // Update photo if not set
      if (!user.photoUrl) {
        user.photoUrl = 'https://i.pravatar.cc/150?img=12';
        user.avatar = 'https://i.pravatar.cc/150?img=12';
        console.log('✅ Updated photo URL');
      }
      
      // Update legacy name field
      if (!user.name || user.name !== firstName) {
        user.name = firstName;
        console.log('✅ Updated legacy name field');
      }
      
      await user.save();
      console.log('✅ User updated successfully');
    }

    console.log('\n✅ Baileysgin user details:');
    console.log(`   Phone: ${user.phoneNumber}`);
    console.log(`   Username: ${user.username || 'not set'}`);
    console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''}`);
    console.log(`   Photo: ${user.photoUrl || 'not set'}`);
    console.log(`   User ID: ${user._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating Baileysgin user:', error);
    process.exit(1);
  }
}

updateBaileysginUser();

