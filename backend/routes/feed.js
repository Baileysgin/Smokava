const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Get all posts (optionally filtered by following users)
router.get('/', auth, async (req, res) => {
  try {
    const { followingOnly, userId } = req.query;
    const User = require('../models/User');
    const currentUser = await User.findById(req.user._id).select('following');

    let query = {};

    // If followingOnly is true and userId is provided, filter by following users
    if (followingOnly === 'true' && userId) {
      const user = await User.findById(userId).select('following');
      if (user && user.following.length > 0) {
        query = { user: { $in: user.following } };
      } else {
        // User follows no one, return empty array
        return res.json([]);
      }
    }

    const posts = await Post.find(query)
      .populate('user', 'firstName lastName username photoUrl phoneNumber name avatar isPrivate')
      .populate('restaurant', 'nameFa addressFa')
      .sort({ createdAt: -1 });

    // Filter out posts from private users unless current user is following them or is the post owner
    const filteredPosts = posts.filter(post => {
      if (!post.user) return false;
      // If user is not private, show the post
      if (!post.user.isPrivate) return true;
      // If current user is the post owner, show the post
      if (post.user._id.toString() === req.user._id.toString()) return true;
      // If current user is following the post owner, show the post
      if (currentUser.following.some(id => id.toString() === post.user._id.toString())) return true;
      // Otherwise, hide the post
      return false;
    });

    res.json(filteredPosts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a post
router.post('/', auth, async (req, res) => {
  try {
    const { restaurantId, flavor, caption, imageUrl } = req.body;

    // Validate required fields
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    if (!caption || !caption.trim()) {
      return res.status(400).json({ message: 'Caption is required' });
    }
    if (!imageUrl) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Verify restaurant exists
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const post = new Post({
      user: req.user._id,
      restaurant: restaurantId,
      flavor: flavor || '',
      caption: caption.trim(),
      imageUrl
    });

    await post.save();
    await post.populate('user', 'firstName lastName username photoUrl phoneNumber name avatar');
    await post.populate('restaurant', 'nameFa addressFa');

    res.json(post);
  } catch (error) {
    console.error('Create post error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like/Unlike a post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.findIndex(
      like => like.user.toString() === req.user._id.toString()
    );

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push({ user: req.user._id });
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      user: req.user._id,
      text
    });

    await post.save();
    await post.populate('comments.user', 'firstName lastName username photoUrl phoneNumber name avatar');
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only allow post owner to delete
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own posts' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
