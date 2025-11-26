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

module.exports = router;


