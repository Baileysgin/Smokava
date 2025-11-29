const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Rating = require('../models/Rating');
const UserPackage = require('../models/UserPackage');

// Submit rating after redemption
router.post('/submit', auth, async (req, res) => {
  try {
    const { restaurantId, operatorId, packageId, redeemLogId, rating, isGift } = req.body;
    const userId = req.user._id;

    if (!restaurantId || !rating || !redeemLogId) {
      return res.status(400).json({ message: 'Restaurant ID, rating, and redeem log ID are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if rating already exists for this redemption
    const existingRating = await Rating.findOne({ userId, redeemLogId });
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this redemption' });
    }

    // Verify the redemption exists in user's package history
    const userPackage = await UserPackage.findOne({
      user: userId,
      'history.redeemLogId': redeemLogId
    });

    if (!userPackage) {
      return res.status(404).json({ message: 'Redemption not found' });
    }

    // Create rating
    const newRating = new Rating({
      userId,
      restaurantId,
      operatorId: operatorId || null,
      packageId: packageId || null,
      isGift: isGift || false,
      rating: parseInt(rating),
      redeemLogId
    });

    await newRating.save();

    res.json({
      message: 'Rating submitted successfully',
      rating: newRating
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's ratings
router.get('/my-ratings', auth, async (req, res) => {
  try {
    const ratings = await Rating.find({ userId: req.user._id })
      .populate('restaurantId', 'nameFa addressFa')
      .populate('operatorId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(ratings);
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending ratings (redemptions that need ratings)
router.get('/pending', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all user packages with history
    const userPackages = await UserPackage.find({ user: userId })
      .populate('package', 'nameFa')
      .populate('history.restaurant', 'nameFa addressFa')
      .populate('operatorId', 'firstName lastName')
      .populate('giftFromRestaurantId', 'nameFa');

    // Get all existing ratings for this user
    const existingRatings = await Rating.find({ userId });
    const ratedRedeemLogIds = new Set(
      existingRatings
        .filter(r => r.redeemLogId)
        .map(r => r.redeemLogId.toString())
    );

    // Find redemptions without ratings (within last 2 days)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const pendingRatings = [];
    let itemsWithoutRedeemLogId = 0;
    let itemsWithRedeemLogId = 0;

    userPackages.forEach(userPackage => {
      if (userPackage.history && userPackage.history.length > 0) {
        userPackage.history.forEach(item => {
          const consumedDate = new Date(item.consumedAt);

          // Only process items within last 2 days
          if (consumedDate >= twoDaysAgo) {
            if (item.redeemLogId) {
              itemsWithRedeemLogId++;
              const redeemLogIdStr = item.redeemLogId.toString();

              // Check if rating is needed (not rated)
              if (!ratedRedeemLogIds.has(redeemLogIdStr)) {
                const restaurant = item.restaurant?._id || item.restaurant;
                pendingRatings.push({
                  redeemLogId: redeemLogIdStr,
                  restaurantId: restaurant?.toString() || restaurant,
                  restaurantName: item.restaurant?.nameFa || userPackage.giftFromRestaurantId?.nameFa || 'رستوران',
                  operatorId: userPackage.operatorId?._id || userPackage.operatorId,
                  packageId: userPackage._id.toString(),
                  isGift: userPackage.isGift || false,
                  consumedAt: item.consumedAt
                });
              }
            } else {
              itemsWithoutRedeemLogId++;
              // Log warning for items without redeemLogId (should be fixed by migration)
              console.warn(`Warning: Redemption without redeemLogId found for user ${userId}, package ${userPackage._id}, consumed at ${item.consumedAt}`);
            }
          }
        });
      }
    });

    // Sort by consumed date (most recent first) and return the first one
    pendingRatings.sort((a, b) => new Date(b.consumedAt) - new Date(a.consumedAt));

    // Log debug info
    if (itemsWithoutRedeemLogId > 0) {
      console.log(`Pending ratings check for user ${userId}: ${itemsWithRedeemLogId} items with redeemLogId, ${itemsWithoutRedeemLogId} items without redeemLogId (need migration)`);
    }

    res.json({
      pending: pendingRatings.length > 0 ? pendingRatings[0] : null,
      count: pendingRatings.length,
      debug: {
        itemsWithRedeemLogId,
        itemsWithoutRedeemLogId,
        totalRatings: existingRatings.length
      }
    });
  } catch (error) {
    console.error('Get pending ratings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all unrated consumptions for user (for wallet page display)
router.get('/unrated-consumptions', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all user packages with history
    const userPackages = await UserPackage.find({ user: userId })
      .populate('package', 'nameFa')
      .populate('history.restaurant', 'nameFa addressFa')
      .populate('operatorId', 'firstName lastName')
      .populate('giftFromRestaurantId', 'nameFa');

    // Get all existing ratings for this user
    const existingRatings = await Rating.find({ userId });
    const ratedRedeemLogIds = new Set(
      existingRatings
        .filter(r => r.redeemLogId)
        .map(r => r.redeemLogId.toString())
    );

    // Find redemptions without ratings (within last 2 days)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const unratedConsumptions = [];

    userPackages.forEach(userPackage => {
      if (userPackage.history && userPackage.history.length > 0) {
        userPackage.history.forEach(item => {
          if (item.redeemLogId) {
            const redeemLogIdStr = item.redeemLogId.toString();
            const consumedDate = new Date(item.consumedAt);

            // Check if rating is needed (not rated and within last 2 days)
            if (!ratedRedeemLogIds.has(redeemLogIdStr) && consumedDate >= twoDaysAgo) {
              const restaurant = item.restaurant?._id || item.restaurant;
              unratedConsumptions.push({
                redeemLogId: redeemLogIdStr,
                restaurantId: restaurant?.toString() || restaurant,
                restaurantName: item.restaurant?.nameFa || userPackage.giftFromRestaurantId?.nameFa || 'رستوران',
                operatorId: userPackage.operatorId?._id || userPackage.operatorId,
                packageId: userPackage._id.toString(),
                isGift: userPackage.isGift || false,
                consumedAt: item.consumedAt,
                count: item.count,
                flavor: item.flavor || ''
              });
            }
          }
        });
      }
    });

    // Sort by consumed date (most recent first)
    unratedConsumptions.sort((a, b) => new Date(b.consumedAt) - new Date(a.consumedAt));

    res.json({
      consumptions: unratedConsumptions,
      count: unratedConsumptions.length
    });
  } catch (error) {
    console.error('Get unrated consumptions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
