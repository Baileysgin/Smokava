const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const auth = require('../middleware/auth');

// Get ratings (placeholder - implement as needed)
router.get('/', auth, async (req, res) => {
  try {
    const ratings = await Rating.find().limit(10);
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

