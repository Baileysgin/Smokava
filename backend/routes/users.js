const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, avatar, isPrivate } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (isPrivate !== undefined) user.isPrivate = isPrivate;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userPackages = await UserPackage.find({ user: req.user._id });
    const totalConsumed = userPackages.reduce((sum, pkg) => {
      return sum + (pkg.totalCount - pkg.remainingCount);
    }, 0);

    const posts = await Post.find({ user: req.user._id });

    res.json({
      totalConsumed,
      totalPackages: userPackages.length,
      totalPosts: posts.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Follow/Unfollow a user
router.post('/follow/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser._id.toString() === userId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const isFollowing = currentUser.following.includes(userId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== userId
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUser._id.toString()
      );
    } else {
      // Follow
      if (!currentUser.following.includes(userId)) {
        currentUser.following.push(userId);
      }
      if (!targetUser.followers.includes(currentUser._id)) {
        targetUser.followers.push(currentUser._id);
      }
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      following: !isFollowing,
      followingCount: currentUser.following.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get following list (must be before /:userId route)
router.get('/following', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('following', 'firstName lastName username photoUrl phoneNumber');
    res.json(user.following || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update profile photo
router.patch('/:userId/profile-photo', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.photoUrl = photoUrl;
    user.avatar = photoUrl; // Update legacy field too
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update username
router.patch('/:userId/username', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    // Validate username format: A-Z, 0-9, underscore, no spaces
    if (!/^[A-Za-z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
    }
    // Check if username is already taken
    const existingUser = await User.findOne({ username, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.username = username;
    await user.save();
    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update bio
router.patch('/:userId/bio', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { bio } = req.body;
    if (bio && bio.length > 200) {
      return res.status(400).json({ message: 'Bio must be 200 characters or less' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.bio = bio || '';
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get followers count
router.get('/:userId/followers/count', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('followers');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ count: user.followers?.length || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get following count
router.get('/:userId/following/count', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('following');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ count: user.following?.length || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get followers list
router.get('/:userId/followers', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate('followers', 'firstName lastName username photoUrl phoneNumber name avatar');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.followers || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get following list for a user
router.get('/:userId/following', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate('following', 'firstName lastName username photoUrl phoneNumber name avatar');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.following || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user (for privacy settings)
router.patch('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    // Only allow users to update their own profile
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { isPrivate } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (isPrivate !== undefined) {
      user.isPrivate = isPrivate;
    }
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user by ID
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select('firstName lastName username photoUrl phoneNumber name avatar following followers isPrivate bio');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get follower/following counts
    const followerCount = user.followers?.length || 0;
    const followingCount = user.following?.length || 0;

    // Check if current user is following this user
    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following?.some(
      (id) => id.toString() === userId
    ) || false;

    res.json({
      ...user.toObject(),
      followerCount,
      followingCount,
      isFollowing
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user posts
router.get('/:userId/posts', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ user: userId })
      .populate('user', 'firstName lastName username photoUrl phoneNumber name avatar')
      .populate('restaurant', 'nameFa addressFa')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get contacts by phone numbers (for Telegram contacts integration)
router.post('/contacts', auth, async (req, res) => {
  try {
    const { phoneNumbers } = req.body;

    if (!Array.isArray(phoneNumbers)) {
      return res.status(400).json({ message: 'phoneNumbers must be an array' });
    }

    const contacts = await User.find({
      phoneNumber: { $in: phoneNumbers }
    }).select('firstName lastName username photoUrl phoneNumber telegramId');

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
