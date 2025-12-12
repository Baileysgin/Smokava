const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const Post = require('../models/Post');
const FollowRequest = require('../models/FollowRequest');
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

    // Calculate total consumed from history (authoritative source)
    let totalConsumed = 0;
    const restaurantsVisited = new Set();
    const flavors = new Set();

    userPackages.forEach(pkg => {
      if (pkg.history && pkg.history.length > 0) {
        // Use history as authoritative source
        pkg.history.forEach(item => {
          totalConsumed += (item.count || 1);
          if (item.restaurant) {
            restaurantsVisited.add(item.restaurant.toString());
          }
          if (item.flavor) {
            flavors.add(item.flavor);
          }
        });
      } else {
        // Fallback to remainingCount calculation if no history
        totalConsumed += (pkg.totalCount - pkg.remainingCount);
      }
    });

    // Calculate days active (from first package purchase or first post)
    // Optimize: Only get the first post by date, don't fetch all posts
    const firstPackage = userPackages.length > 0
      ? userPackages.reduce((earliest, pkg) => {
          const pkgDate = new Date(pkg.purchasedAt || 0);
          const earliestDate = new Date(earliest.purchasedAt || 0);
          return pkgDate < earliestDate ? pkg : earliest;
        }, userPackages[0])
      : null;

    // Only fetch the first post by creation date (optimized query)
    const firstPost = await Post.findOne({ user: req.user._id })
      .sort({ createdAt: 1 })
      .select('createdAt')
      .lean();

    let daysActive = 0;
    if (firstPackage || firstPost) {
      const startDate = firstPackage && firstPost
        ? (new Date(firstPackage.purchasedAt) < new Date(firstPost.createdAt)
            ? new Date(firstPackage.purchasedAt)
            : new Date(firstPost.createdAt))
        : (firstPackage ? new Date(firstPackage.purchasedAt) : new Date(firstPost.createdAt));
      const daysDiff = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
      daysActive = Math.max(1, daysDiff);
    }

    const postsCount = await Post.countDocuments({ user: req.user._id, deletedAt: null, published: true });

    res.json({
      totalConsumed,
      totalPackages: userPackages.length,
      totalPosts: postsCount,
      restaurantsVisited: restaurantsVisited.size,
      diverseFlavors: flavors.size,
      daysActive
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
      // Delete any pending follow request
      await FollowRequest.findOneAndDelete({
        requesterId: currentUser._id,
        targetUserId: userId
      });
    } else {
      // Check if profile is private
      if (targetUser.isPrivate) {
        // Create follow request
        const existingRequest = await FollowRequest.findOne({
          requesterId: currentUser._id,
          targetUserId: userId,
          status: 'pending'
        });

        if (!existingRequest) {
          await FollowRequest.create({
            requesterId: currentUser._id,
            targetUserId: userId,
            status: 'pending'
          });
        }

        return res.json({
          following: false,
          pending: true,
          message: 'Follow request sent'
        });
      } else {
        // Public profile - follow directly
        if (!currentUser.following.includes(userId)) {
          currentUser.following.push(userId);
        }
        if (!targetUser.followers.includes(currentUser._id)) {
          targetUser.followers.push(currentUser._id);
        }
      }
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      following: !isFollowing,
      followingCount: currentUser.following.length,
      pending: false
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
    // Use array length directly (should be accurate if array is maintained properly)
    // But also verify with count to ensure accuracy
    const count = user.following?.length || 0;
    res.json({ count });
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

// Public profile endpoint (no auth required, but supports optional auth for mutual data)
router.get('/:id/public', async (req, res) => {
  try {
    const { id } = req.params;
    // Optional auth - try to get user if authenticated
    let currentUserId = null;
    try {
      if (req.headers.authorization) {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        currentUserId = decoded.userId || decoded._id;
      }
    } catch (error) {
      // Not authenticated or invalid token - continue without auth
    }

    // Try to find by username first, then by ID
    let user = await User.findOne({ username: id })
      .select('firstName lastName username photoUrl bio createdAt _id');

    if (!user) {
      // Fallback to ID lookup
      user = await User.findById(id)
        .select('firstName lastName username photoUrl bio createdAt _id');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use user._id for all queries (works for both username and ID lookups)
    const userId = user._id;

    // Get public posts only
    const posts = await Post.find({
      user: userId,
      deletedAt: null,
      published: true
    })
      .populate('restaurant', 'nameFa addressFa')
      .sort({ createdAt: -1 })
      .limit(20)
      .select('caption imageUrl restaurant flavor createdAt likes');

    // Get stats from history (authoritative source)
    // Optimize: Only fetch necessary fields
    const userPackages = await UserPackage.find({ user: userId })
      .select('history totalCount remainingCount')
      .lean();

    let totalConsumed = 0;
    const restaurantsVisited = new Set();

    userPackages.forEach(pkg => {
      if (pkg.history && pkg.history.length > 0) {
        // Use history as authoritative source
        pkg.history.forEach(item => {
          totalConsumed += (item.count || 1);
          if (item.restaurant) {
            restaurantsVisited.add(item.restaurant.toString());
          }
        });
      } else {
        // Fallback to remainingCount calculation if no history
        totalConsumed += (pkg.totalCount - pkg.remainingCount);
      }
    });

    const postsCount = await Post.countDocuments({
      user: userId,
      deletedAt: null,
      published: true
    });

    // Get follower/following counts - use aggregation for accuracy
    const followerCount = await User.countDocuments({ following: userId });
    const followingCount = user.following?.length || 0; // Following is stored in user document

    // Calculate mutual restaurants (if current user is authenticated)
    let mutualRestaurants = [];
    if (currentUserId && currentUserId.toString() !== userId.toString()) {
      const currentUserPackages = await UserPackage.find({ user: currentUserId });
      const currentUserRestaurants = new Set();

      currentUserPackages.forEach(pkg => {
        if (pkg.history && pkg.history.length > 0) {
          pkg.history.forEach(item => {
            if (item.restaurant) {
              currentUserRestaurants.add(item.restaurant.toString());
            }
          });
        }
      });

      // Find mutual restaurants
      const mutualRestaurantIds = Array.from(restaurantsVisited).filter(rid =>
        currentUserRestaurants.has(rid)
      );

      if (mutualRestaurantIds.length > 0) {
        const Restaurant = require('../models/Restaurant');
        mutualRestaurants = await Restaurant.find({
          _id: { $in: mutualRestaurantIds }
        }).select('nameFa addressFa _id').limit(10);
      }
    }

    res.json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        photoUrl: user.photoUrl,
        bio: user.bio,
        createdAt: user.createdAt
      },
      stats: {
        totalConsumed,
        restaurantsVisited: restaurantsVisited.size,
        totalPosts: postsCount,
        followerCount,
        followingCount
      },
      mutualRestaurants,
      posts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate invite link
router.post('/:id/invite', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is admin or operator
    if (req.user.role !== 'admin' && req.user.role !== 'restaurant_operator' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Generate invite token (simple JWT-like token)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: id, type: 'invite' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const inviteUrl = `${process.env.FRONTEND_URL || 'https://smokava.com'}/invite/${token}`;

    res.json({
      inviteUrl,
      token,
      expiresIn: '7d'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
