require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava');
    console.log('✅ MongoDB connected');

    const username = process.argv[2] || 'admin';

    // Check if admin exists
    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.log(`❌ Admin with username "${username}" does NOT exist`);
      console.log(`\n💡 To create an admin, run:`);
      console.log(`   npm run create-admin [username] [password]`);
      console.log(`   or`);
      console.log(`   node scripts/createAdmin.js [username] [password]`);
      process.exit(1);
    }

    console.log(`✅ Admin user found: ${username}`);
    console.log(`   ID: ${admin._id}`);
    console.log(`   Created at: ${admin.createdAt}`);

    // Try to load credentials from volume if available
    const fs = require('fs');
    const path = require('path');
    const ADMIN_CREDENTIALS_PATH = process.env.ADMIN_CREDENTIALS_PATH || '/app/data/admin-credentials.json';

    if (fs.existsSync(ADMIN_CREDENTIALS_PATH)) {
      try {
        const credentials = JSON.parse(fs.readFileSync(ADMIN_CREDENTIALS_PATH, 'utf8'));
        console.log(`\n📄 Credentials file found at: ${ADMIN_CREDENTIALS_PATH}`);
        console.log(`   Username: ${credentials.username}`);
        console.log(`   Password: ${credentials.password}`);
        console.log(`   ⚠️  Note: This is the password that was used when the admin was created.`);
        console.log(`   ⚠️  If the password was changed manually in the database, this file won't reflect that.`);
      } catch (err) {
        console.log(`\n⚠️  Could not read credentials file: ${ADMIN_CREDENTIALS_PATH}`);
      }
    } else {
      console.log(`\n📄 No credentials file found at: ${ADMIN_CREDENTIALS_PATH}`);
      console.log(`   Default password is usually: admin123`);
    }

    // Option to reset password
    const resetPassword = process.argv[3];
    if (resetPassword) {
      console.log(`\n🔄 Resetting password for admin: ${username}`);
      admin.password = resetPassword;
      await admin.save();
      console.log(`✅ Password reset successfully!`);
      console.log(`   New password: ${resetPassword}`);

      // Update credentials file
      if (fs.existsSync(ADMIN_CREDENTIALS_PATH)) {
        const credentials = {
          username,
          password: resetPassword,
          createdAt: admin.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const ADMIN_DATA_DIR = path.dirname(ADMIN_CREDENTIALS_PATH);
        if (!fs.existsSync(ADMIN_DATA_DIR)) {
          fs.mkdirSync(ADMIN_DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(ADMIN_CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));
        console.log(`✅ Credentials file updated`);
      }
    } else {
      console.log(`\n💡 To reset the password, run:`);
      console.log(`   node scripts/checkAdmin.js ${username} <new_password>`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admin:', error);
    process.exit(1);
  }
};

checkAdmin();
