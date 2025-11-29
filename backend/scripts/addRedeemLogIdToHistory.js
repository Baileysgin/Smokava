/**
 * Migration script to add redeemLogId to existing redemptions that don't have it
 * This allows old redemptions to be rateable
 */

require('dotenv').config();
const mongoose = require('mongoose');
const UserPackage = require('../models/UserPackage');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smokava';

async function addRedeemLogIds() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all user packages
    const userPackages = await UserPackage.find({});
    console.log(`Found ${userPackages.length} user packages`);

    let totalUpdated = 0;
    let totalHistoryItems = 0;
    let itemsWithoutRedeemLogId = 0;

    for (const userPackage of userPackages) {
      if (!userPackage.history || userPackage.history.length === 0) {
        continue;
      }

      let packageUpdated = false;
      totalHistoryItems += userPackage.history.length;

      for (let i = 0; i < userPackage.history.length; i++) {
        const historyItem = userPackage.history[i];

        // Check if redeemLogId is missing
        if (!historyItem.redeemLogId) {
          // Generate a new redeemLogId for this redemption
          historyItem.redeemLogId = new mongoose.Types.ObjectId();
          itemsWithoutRedeemLogId++;
          packageUpdated = true;
        }
      }

      if (packageUpdated) {
        await userPackage.save();
        totalUpdated++;
        console.log(`Updated package ${userPackage._id} with ${userPackage.history.length} history items`);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total packages checked: ${userPackages.length}`);
    console.log(`Total history items: ${totalHistoryItems}`);
    console.log(`History items without redeemLogId: ${itemsWithoutRedeemLogId}`);
    console.log(`Packages updated: ${totalUpdated}`);
    console.log('Migration completed successfully!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

addRedeemLogIds();
