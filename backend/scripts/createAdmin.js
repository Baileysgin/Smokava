require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/smokava');
    console.log('MongoDB connected');

    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log(`Admin with username "${username}" already exists`);
      process.exit(0);
    }

    // Create admin
    const admin = new Admin({ username, password });
    await admin.save();

    // Save credentials to Docker volume for persistence
    const fs = require('fs');
    const path = require('path');
    const ADMIN_CREDENTIALS_PATH = process.env.ADMIN_CREDENTIALS_PATH || '/app/data/admin-credentials.json';
    const ADMIN_DATA_DIR = path.dirname(ADMIN_CREDENTIALS_PATH);

    // Ensure data directory exists
    if (!fs.existsSync(ADMIN_DATA_DIR)) {
      fs.mkdirSync(ADMIN_DATA_DIR, { recursive: true });
    }

    // Save credentials to volume
    const credentials = {
      username,
      password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(ADMIN_CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));

    console.log(`✅ Admin created successfully!`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`✅ Credentials saved to volume: ${ADMIN_CREDENTIALS_PATH}`);
    console.log(`\n⚠️  Please change the default password after first login.`);
    console.log(`🔒 Admin user is protected and will persist across deployments.`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
