require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const fs = require('fs');
const path = require('path');

// Path to store admin credentials in Docker volume
const ADMIN_CREDENTIALS_PATH = process.env.ADMIN_CREDENTIALS_PATH || '/app/data/admin-credentials.json';
const ADMIN_DATA_DIR = path.dirname(ADMIN_CREDENTIALS_PATH);

const ensureAdmin = async () => {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(ADMIN_DATA_DIR)) {
      fs.mkdirSync(ADMIN_DATA_DIR, { recursive: true });
      console.log(`✅ Created admin data directory: ${ADMIN_DATA_DIR}`);
    }

    // Try to load admin credentials from volume
    let adminUsername = 'admin';
    let adminPassword = 'admin123';
    let credentialsFromVolume = false;

    if (fs.existsSync(ADMIN_CREDENTIALS_PATH)) {
      try {
        const credentials = JSON.parse(fs.readFileSync(ADMIN_CREDENTIALS_PATH, 'utf8'));
        adminUsername = credentials.username || adminUsername;
        adminPassword = credentials.password || adminPassword;
        credentialsFromVolume = true;
        console.log('✅ Loaded admin credentials from volume');
      } catch (err) {
        console.warn('⚠️  Failed to read admin credentials from volume, using defaults');
      }
    }

    // Check if admin exists in database
    let admin = await Admin.findOne({ username: adminUsername });

    if (!admin) {
      // Create admin if it doesn't exist
      console.log(`📝 Creating admin user: ${adminUsername}`);
      admin = new Admin({ username: adminUsername, password: adminPassword });
      await admin.save();
      console.log('✅ Admin user created successfully');

      // Save credentials to volume for persistence
      const credentials = {
        username: adminUsername,
        password: adminPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(ADMIN_CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));
      console.log(`✅ Admin credentials saved to volume: ${ADMIN_CREDENTIALS_PATH}`);
    } else {
      console.log(`✅ Admin user already exists: ${adminUsername}`);

      // If credentials are from volume but password might have changed, update volume
      if (credentialsFromVolume) {
        const credentials = {
          username: adminUsername,
          password: adminPassword,
          createdAt: admin.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        fs.writeFileSync(ADMIN_CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));
      }
    }

    console.log(`✅ Admin user protected: ${adminUsername}`);
    return { username: adminUsername, exists: true };
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error);
    throw error;
  }
};

module.exports = { ensureAdmin };
