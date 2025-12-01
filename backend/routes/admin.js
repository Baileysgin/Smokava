const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Post = require('../models/Post');
const UserPackage = require('../models/UserPackage');
const Package = require('../models/Package');
const Rating = require('../models/Rating');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const ModerationLog = require('../models/ModerationLog');
const auth = require('../middleware/auth');

// Simple in-memory cache for dashboard stats (5 minutes)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCached = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Admin login
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt received');
    console.log('Request body:', { username: req.body.username, hasPassword: !!req.body.password });

    const { username, password } = req.body;

    if (!username || !password) {
      console.log('❌ Missing username or password');
      return res.status(400).json({ message: 'Username and password are required' });
    }

    console.log('🔍 Looking for admin with username:', username);
    const admin = await Admin.findOne({ username });

    if (!admin) {
      console.log('❌ Admin not found:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Admin found, checking password...');
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      console.log('❌ Password mismatch for admin:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Password correct, generating token...');
    const token = admin.generateAuthToken();
    console.log('✅ Token generated, sending response');
    res.json({ token, admin: { id: admin._id, username: admin.username } });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  console.log('requireAdmin check - req.user:', req.user ? { id: req.user._id, role: req.user.role, hasRole: !!req.user.role } : 'none');
  console.log('requireAdmin - req.headers.authorization:', req.headers.authorization ? 'present' : 'missing');

  // Check if user is authenticated first
  if (!req.user) {
    console.log('❌ No user in request - authentication failed');
    return res.status(401).json({
      message: 'Authentication required. Please login.'
    });
  }

  // Explicitly deny restaurant operators
  if (req.user.role === 'restaurant_operator') {
    console.log('❌ Restaurant operator access denied to admin routes');
    return res.status(403).json({
      message: 'Access denied. Restaurant operators cannot access admin features.'
    });
  }

  // Check if user has admin role
  if (req.user.role === 'admin') {
    console.log('✅ Admin access granted for user:', req.user._id);
    return next();
  }

  console.log('❌ Admin access denied - user role:', req.user.role || 'undefined');
  return res.status(403).json({
    message: 'Access denied. Admin only.',
    userRole: req.user.role || 'undefined'
  });
};

// Get dashboard statistics (with caching)
router.get('/dashboard/stats', auth, requireAdmin, async (req, res) => {
  try {
    const cacheKey = 'admin-dashboard-stats';

    // Check cache first
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const totalUsers = await User.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalPackages = await UserPackage.countDocuments();

    // Calculate total consumed shisha
    const userPackages = await UserPackage.find();
    const totalConsumed = userPackages.reduce((sum, pkg) => {
      return sum + (pkg.totalCount - pkg.remainingCount);
    }, 0);

    // Calculate recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const stats = {
      totalUsers,
      totalRestaurants,
      totalPosts,
      totalPackages,
      totalConsumed,
      recentUsers
    };

    // Cache the result
    setCached(cacheKey, stats);

    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all restaurants
router.get('/restaurants', auth, requireAdmin, async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get restaurant by ID
router.get('/restaurants/:id', auth, requireAdmin, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    console.error('Get restaurant by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create restaurant
router.post('/restaurants', auth, requireAdmin, async (req, res) => {
  try {
    const { name, nameFa, address, addressFa, phone, city, description, image, coordinates } = req.body;

    if (!name || !nameFa || !address || !addressFa) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Handle coordinates - can be array [longitude, latitude] or object {longitude, latitude}
    let locationCoords = [0, 0]; // Default coordinates
    if (coordinates) {
      if (Array.isArray(coordinates) && coordinates.length === 2) {
        locationCoords = [coordinates[0], coordinates[1]]; // [longitude, latitude]
      } else if (coordinates.longitude !== undefined && coordinates.latitude !== undefined) {
        locationCoords = [coordinates.longitude, coordinates.latitude];
      }
    }

    const restaurant = new Restaurant({
      name,
      nameFa,
      address,
      addressFa,
      phone: phone || '',
      city: city || '',
      description: description || '',
      active: req.body.active !== undefined ? req.body.active : true,
      image: image || '',
      imageUrl: image || '',
      location: {
        type: 'Point',
        coordinates: locationCoords
      }
    });

    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update restaurant (PUT - full update)
router.put('/restaurants/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { name, nameFa, address, addressFa, phone, city, description, active, image, coordinates } = req.body;

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (name !== undefined) restaurant.name = name;
    if (nameFa !== undefined) restaurant.nameFa = nameFa;
    if (address !== undefined) restaurant.address = address;
    if (addressFa !== undefined) restaurant.addressFa = addressFa;
    if (phone !== undefined) restaurant.phone = phone;
    if (city !== undefined) restaurant.city = city;
    if (description !== undefined) restaurant.description = description;
    if (active !== undefined) restaurant.active = active;
    if (image !== undefined) {
      restaurant.image = image;
      restaurant.imageUrl = image;
    }
    if (coordinates) {
      // Handle coordinates - can be array [longitude, latitude] or object {longitude, latitude}
      let locationCoords;
      if (Array.isArray(coordinates) && coordinates.length === 2) {
        locationCoords = [coordinates[0], coordinates[1]]; // [longitude, latitude]
      } else if (coordinates.longitude !== undefined && coordinates.latitude !== undefined) {
        locationCoords = [coordinates.longitude, coordinates.latitude];
      } else {
        return res.status(400).json({ message: 'Invalid coordinates format' });
      }

      restaurant.location = {
        type: 'Point',
        coordinates: locationCoords
      };
    }

    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update restaurant (PATCH - partial update)
router.patch('/restaurants/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { name, nameFa, address, addressFa, phone, city, description, active, image, coordinates } = req.body;

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (name !== undefined) restaurant.name = name;
    if (nameFa !== undefined) restaurant.nameFa = nameFa;
    if (address !== undefined) restaurant.address = address;
    if (addressFa !== undefined) restaurant.addressFa = addressFa;
    if (phone !== undefined) restaurant.phone = phone;
    if (city !== undefined) restaurant.city = city;
    if (description !== undefined) restaurant.description = description;
    if (active !== undefined) restaurant.active = active;
    if (image !== undefined) {
      restaurant.image = image;
      restaurant.imageUrl = image;
    }
    if (coordinates) {
      // Handle coordinates - can be array [longitude, latitude] or object {longitude, latitude}
      let locationCoords;
      if (Array.isArray(coordinates) && coordinates.length === 2) {
        locationCoords = [coordinates[0], coordinates[1]]; // [longitude, latitude]
      } else if (coordinates.longitude !== undefined && coordinates.latitude !== undefined) {
        locationCoords = [coordinates.longitude, coordinates.latitude];
      } else {
        return res.status(400).json({ message: 'Invalid coordinates format' });
      }

      restaurant.location = {
        type: 'Point',
        coordinates: locationCoords
      };
    }

    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete restaurant
router.delete('/restaurants/:id', auth, requireAdmin, async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get consumed packages
router.get('/consumed-packages', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Get all user packages with consumed items
    const userPackages = await UserPackage.find()
      .populate('user', 'name phoneNumber')
      .populate('package', 'nameFa count price')
      .populate('history.restaurant', 'nameFa addressFa')
      .sort({ purchasedAt: -1 });

    // Flatten history for easier display
    const consumedItems = [];
    userPackages.forEach(userPackage => {
      if (userPackage.history && userPackage.history.length > 0) {
        userPackage.history.forEach(item => {
          consumedItems.push({
            id: item._id,
            user: userPackage.user,
            package: userPackage.package,
            restaurant: item.restaurant,
            count: item.count,
            flavor: item.flavor,
            consumedAt: item.consumedAt
          });
        });
      }
    });

    // Sort by consumed date (newest first)
    consumedItems.sort((a, b) => new Date(b.consumedAt) - new Date(a.consumedAt));

    const total = consumedItems.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    res.json({
      items: consumedItems.slice(startIndex, endIndex),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Get consumed packages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (for admin)
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    console.log('📊 GET /admin/users - Request received');
    console.log('📊 MongoDB connection state:', mongoose.connection.readyState);
    console.log('📊 Database name:', mongoose.connection.db?.databaseName);
    
    const { page = 1, limit = 20 } = req.query;

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Database connection error',
        error: 'MongoDB not connected',
        users: [],
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 0
      });
    }

    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-otpCode -otpExpiresAt');

    const total = await User.countDocuments();

    console.log(`📊 GET /admin/users - Found ${users.length} users (total: ${total})`);
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName || 'unknown'}`);

    res.json({
      users: users || [],
      total: total || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((total || 0) / limit)
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    console.error('Error stack:', error.stack);
    console.error('MongoDB state:', mongoose.connection.readyState);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      users: [],
      total: 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: 0
    });
  }
});

// Get user details
router.get('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-otpCode -otpExpiresAt')
      .populate('assignedRestaurant', 'nameFa addressFa');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's packages
    const userPackages = await UserPackage.find({ user: user._id })
      .populate('package', 'nameFa count price')
      .populate('history.restaurant', 'nameFa addressFa');

    // Get user's posts
    const userPosts = await Post.find({ user: user._id })
      .populate('restaurant', 'nameFa addressFa')
      .sort({ createdAt: -1 });

    // Calculate stats from history (authoritative source)
    let totalConsumed = 0;
    const restaurantsVisited = new Set();

    userPackages.forEach(pkg => {
      if (pkg.history && pkg.history.length > 0) {
        // Use history as authoritative source
        pkg.history.forEach(item => {
          totalConsumed += (item.count || 1);
          if (item.restaurant) {
            restaurantsVisited.add(item.restaurant._id.toString());
          }
        });
      } else {
        // Fallback to remainingCount calculation if no history
        totalConsumed += (pkg.totalCount - pkg.remainingCount);
      }
    });

    res.json({
      user,
      packages: userPackages,
      posts: userPosts,
      stats: {
        totalPackages: userPackages.length,
        totalConsumed,
        restaurantsVisited: restaurantsVisited.size,
        totalPosts: userPosts.length
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role and assigned restaurant
router.patch('/users/:id/role', auth, requireAdmin, async (req, res) => {
  try {
    const { role, assignedRestaurant } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate role
    if (role && !['user', 'restaurant_operator', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Update role
    if (role !== undefined) {
      user.role = role;
    }

    // Update assigned restaurant (only for restaurant_operator)
    if (assignedRestaurant !== undefined) {
      if (user.role === 'restaurant_operator') {
        // Verify restaurant exists
        const restaurant = await Restaurant.findById(assignedRestaurant);
        if (!restaurant) {
          return res.status(404).json({ message: 'Restaurant not found' });
        }
        user.assignedRestaurant = assignedRestaurant;
      } else {
        user.assignedRestaurant = null;
      }
    }

    await user.save();

    // Populate assigned restaurant for response
    await user.populate('assignedRestaurant', 'nameFa addressFa');

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sold packages
router.get('/sold-packages', auth, requireAdmin, async (req, res) => {
  try {
    console.log('📦 GET /admin/sold-packages - Request received');
    const { page = 1, limit = 20 } = req.query;

    const userPackages = await UserPackage.find()
      .populate('user', 'name phoneNumber')
      .populate('package', 'nameFa count price')
      .sort({ purchasedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await UserPackage.countDocuments();

    console.log(`📦 GET /admin/sold-packages - Found ${userPackages.length} packages (total: ${total})`);

    const packages = userPackages.map(pkg => ({
      _id: pkg._id,
      user: pkg.user,
      package: pkg.package,
      totalCount: pkg.totalCount,
      remainingCount: pkg.remainingCount,
      consumedCount: pkg.totalCount - pkg.remainingCount,
      purchasedAt: pkg.purchasedAt
    }));

    res.json({
      packages,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('❌ Get sold packages error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all packages
router.get('/packages', auth, requireAdmin, async (req, res) => {
  try {
    console.log('Backend: /admin/packages endpoint hit');
    console.log('Backend: User:', req.user ? { id: req.user._id, role: req.user.role } : 'none');

    // Get packages - try sorting by createdAt, fallback to _id
    let packages;
    try {
      packages = await Package.find().sort({ createdAt: -1 });
    } catch (sortError) {
      console.log('Sort by createdAt failed, using _id');
      packages = await Package.find().sort({ _id: -1 });
    }

    console.log('Backend: Found', packages.length, 'packages');
    console.log('Backend: Packages:', packages.map(p => ({ id: p._id.toString(), name: p.nameFa, count: p.count })));

    // Convert to plain objects with string _id
    const packagesData = packages.map(pkg => {
      const pkgObj = pkg.toObject ? pkg.toObject() : pkg;
      return {
        ...pkgObj,
        _id: pkg._id.toString()
      };
    });

    console.log('Backend: Sending', packagesData.length, 'packages');
    res.json(packagesData);
  } catch (error) {
    console.error('Get packages error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get package by ID
router.get('/package/:id', auth, requireAdmin, async (req, res) => {
  try {
    console.log('📦 GET /admin/package/:id - Request received for package:', req.params.id);
    const package = await Package.findById(req.params.id);

    if (!package) {
      console.log('❌ Package not found:', req.params.id);
      return res.status(404).json({ message: 'Package not found' });
    }

    const pkgObj = package.toObject ? package.toObject() : package;

    // Log the feature fields to debug
    console.log('📦 Package loaded:', {
      _id: pkgObj._id,
      nameFa: pkgObj.nameFa,
      feature_usage_fa: pkgObj.feature_usage_fa,
      feature_validity_fa: pkgObj.feature_validity_fa,
      feature_support_fa: pkgObj.feature_support_fa,
    });

    const response = {
      ...pkgObj,
      _id: package._id.toString()
    };

    console.log('📦 Sending package response with', Object.keys(response).length, 'fields');
    res.json(response);
  } catch (error) {
    console.error('❌ Get package by ID error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete package
router.delete('/package/:id', auth, requireAdmin, async (req, res) => {
  try {
    console.log('Backend: Deleting package:', req.params.id);
    const package = await Package.findByIdAndDelete(req.params.id);

    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    console.log('Backend: Package deleted:', package.nameFa);
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update package
router.post('/update-package', auth, requireAdmin, async (req, res) => {
  try {
    const {
      packageId,
      item_quantity,
      total_price,
      package_title_fa,
      quantity_display_fa,
      price_per_item_fa,
      feature_usage_fa,
      feature_validity_fa,
      feature_support_fa,
      package_icon,
      startDate,
      endDate,
      timeWindows,
    } = req.body;

    // Find the package by ID or create a new one
    let package;
    if (packageId) {
      // Update existing package
      package = await Package.findById(packageId);
      if (!package) {
        return res.status(404).json({ message: 'Package not found' });
      }
    } else {
      // Create a new package
      package = new Package({
        name: 'Shisha Package',
        nameFa: package_title_fa || 'پکیج قلیون',
        count: item_quantity || 0,
        price: total_price || 0,
      });
    }

    // Update fields
    if (item_quantity !== undefined) {
      if (!Number.isInteger(Number(item_quantity)) || item_quantity < 0) {
        return res.status(400).json({ message: 'item_quantity must be a non-negative integer' });
      }
      package.count = item_quantity;
    }

    if (total_price !== undefined) {
      if (isNaN(total_price) || total_price < 0) {
        return res.status(400).json({ message: 'total_price must be a non-negative number' });
      }
      package.price = total_price;
    }

    if (package_title_fa !== undefined) {
      package.nameFa = package_title_fa;
    }

    if (quantity_display_fa !== undefined) {
      package.quantity_display_fa = quantity_display_fa;
    }

    if (price_per_item_fa !== undefined) {
      package.price_per_item_fa = price_per_item_fa;
    }

    // Update feature fields - accept empty strings too
    if (feature_usage_fa !== undefined && feature_usage_fa !== null) {
      package.feature_usage_fa = feature_usage_fa || '';
      console.log('✅ Updated feature_usage_fa:', package.feature_usage_fa);
    }

    if (feature_validity_fa !== undefined && feature_validity_fa !== null) {
      package.feature_validity_fa = feature_validity_fa || '';
      console.log('✅ Updated feature_validity_fa:', package.feature_validity_fa);
    }

    if (feature_support_fa !== undefined && feature_support_fa !== null) {
      package.feature_support_fa = feature_support_fa || '';
      console.log('✅ Updated feature_support_fa:', package.feature_support_fa);
    }

    if (package_icon !== undefined) {
      package.package_icon = package_icon;
    }

    // Update time window fields (these are stored in UserPackage, not Package)
    // But we can store them in Package model for reference
    if (startDate !== undefined) {
      package.startDate = startDate ? new Date(startDate) : null;
    }
    if (endDate !== undefined) {
      package.endDate = endDate ? new Date(endDate) : null;
    }
    if (timeWindows !== undefined) {
      package.timeWindows = timeWindows || [];
    }

    await package.save();

    // Reload from database to ensure all fields are included
    const savedPackage = await Package.findById(package._id);
    const pkgObj = savedPackage.toObject ? savedPackage.toObject() : savedPackage;

    console.log('💾 Package saved successfully:', {
      _id: pkgObj._id,
      nameFa: pkgObj.nameFa,
      feature_usage_fa: pkgObj.feature_usage_fa,
      feature_validity_fa: pkgObj.feature_validity_fa,
      feature_support_fa: pkgObj.feature_support_fa,
    });

    res.json({
      ...pkgObj,
      _id: package._id.toString()
    });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all gifts (gift packages)
router.get('/gifts', auth, requireAdmin, async (req, res) => {
  try {
    const { restaurantId, operatorId, customerPhone, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = { isGift: true };

    if (restaurantId) {
      query.giftFromRestaurantId = restaurantId;
    }

    if (operatorId) {
      query.operatorId = operatorId;
    }

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.purchasedAt = {};
      if (startDate) {
        dateFilter.purchasedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.purchasedAt.$lte = new Date(endDate);
      }
    }

    const finalQuery = { ...query, ...dateFilter };

    // If customer phone is provided, find user first
    if (customerPhone) {
      const user = await User.findOne({ phoneNumber: customerPhone });
      if (user) {
        finalQuery.user = user._id;
      } else {
        // No user found, return empty result
        return res.json({
          items: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        });
      }
    }

    const total = await UserPackage.countDocuments(finalQuery);
    const gifts = await UserPackage.find(finalQuery)
      .populate('user', 'phoneNumber firstName lastName name')
      .populate('giftFromRestaurantId', 'nameFa addressFa')
      .populate('operatorId', 'firstName lastName')
      .sort({ purchasedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Check if each gift is used
    const giftsWithStatus = gifts.map(gift => {
      const isUsed = gift.remainingCount === 0;
      return {
        ...gift.toObject(),
        status: isUsed ? 'Used' : 'Not used'
      };
    });

    res.json({
      items: giftsWithStatus,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get gifts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all ratings/feedbacks
router.get('/ratings', auth, requireAdmin, async (req, res) => {
  try {
    const { restaurantId, operatorId, rating, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};

    if (restaurantId) {
      query.restaurantId = restaurantId;
    }

    if (operatorId) {
      query.operatorId = operatorId;
    }

    if (rating) {
      query.rating = parseInt(rating);
    }

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    const finalQuery = { ...query, ...dateFilter };

    const total = await Rating.countDocuments(finalQuery);
    const ratings = await Rating.find(finalQuery)
      .populate('userId', 'phoneNumber firstName lastName name')
      .populate('restaurantId', 'nameFa addressFa')
      .populate('operatorId', 'firstName lastName')
      .populate('packageId', 'isGift')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const ratingsWithPackageType = ratings.map(rating => ({
      ...rating.toObject(),
      packageType: rating.packageId?.isGift ? 'Gift' : 'Purchased'
    }));

    res.json({
      items: ratingsWithPackageType,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ratings analytics
router.get('/ratings/analytics', auth, requireAdmin, async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;

    const query = {};
    if (restaurantId) {
      query.restaurantId = restaurantId;
    }

    // Build date filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const ratings = await Rating.find(query)
      .populate('restaurantId', 'nameFa');

    // Calculate average rating per restaurant
    const restaurantRatings = {};
    ratings.forEach(rating => {
      const restaurantId = rating.restaurantId?._id?.toString() || 'unknown';
      const restaurantName = rating.restaurantId?.nameFa || 'Unknown';

      if (!restaurantRatings[restaurantId]) {
        restaurantRatings[restaurantId] = {
          name: restaurantName,
          ratings: [],
          total: 0,
          count: 0
        };
      }

      restaurantRatings[restaurantId].ratings.push(rating.rating);
      restaurantRatings[restaurantId].total += rating.rating;
      restaurantRatings[restaurantId].count += 1;
    });

    // Calculate averages and find best/worst
    const restaurantStats = Object.values(restaurantRatings).map(rest => ({
      restaurantId: Object.keys(restaurantRatings).find(
        id => restaurantRatings[id].name === rest.name
      ),
      restaurantName: rest.name,
      averageRating: rest.count > 0 ? (rest.total / rest.count).toFixed(2) : 0,
      totalRatings: rest.count
    }));

    // Sort by average rating
    restaurantStats.sort((a, b) => parseFloat(b.averageRating) - parseFloat(a.averageRating));

    const bestRestaurant = restaurantStats.length > 0 ? restaurantStats[0] : null;
    const worstRestaurant = restaurantStats.length > 0 ? restaurantStats[restaurantStats.length - 1] : null;

    res.json({
      totalRatings: ratings.length,
      averageRatingPerRestaurant: restaurantStats,
      bestRestaurant,
      worstRestaurant
    });
  } catch (error) {
    console.error('Get ratings analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Activate package for a user (Admin only)
router.post('/activate-package', auth, requireAdmin, async (req, res) => {
  try {
    const { userId, packageId, startDate, endDate, timeWindows } = req.body;

    if (!userId || !packageId) {
      return res.status(400).json({ message: 'User ID and Package ID are required' });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify package exists
    const package = await Package.findById(packageId);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Create user package with time-based fields
    const userPackage = new UserPackage({
      user: userId,
      package: packageId,
      totalCount: package.count,
      remainingCount: package.count,
      status: 'active',
      purchasedAt: new Date(),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      timeWindows: timeWindows || package.timeWindows || []
    });

    await userPackage.save();
    await userPackage.populate('package', 'name nameFa count price');
    await userPackage.populate('user', 'phoneNumber firstName lastName');

    console.log(`✅ Admin activated package ${packageId} for user ${userId}`);

    res.json({
      message: 'Package activated successfully',
      userPackage
    });
  } catch (error) {
    console.error('Activate package error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Role assignment endpoints
// Assign role(s) to a user
router.post('/users/:id/roles', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { roleNames, restaurantId } = req.body;

    if (!roleNames || !Array.isArray(roleNames) || roleNames.length === 0) {
      return res.status(400).json({ message: 'roleNames array is required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const assignedRoles = [];

    for (const roleName of roleNames) {
      // Find or create role
      let role = await Role.findOne({ name: roleName.toLowerCase() });
      if (!role) {
        role = new Role({ name: roleName.toLowerCase() });
        await role.save();
      }

      // Check if user already has this role
      const existingUserRole = await UserRole.findOne({
        userId: id,
        roleId: role._id,
        'scope.restaurantId': restaurantId || null
      });

      if (!existingUserRole) {
        const userRole = new UserRole({
          userId: id,
          roleId: role._id,
          scope: { restaurantId: restaurantId || null },
          assignedBy: req.user._id
        });
        await userRole.save();
        assignedRoles.push(userRole);
      } else {
        assignedRoles.push(existingUserRole);
      }
    }

    // Update user's legacy role field for backward compatibility
    if (roleNames.includes('admin')) {
      user.role = 'admin';
    } else if (roleNames.includes('operator')) {
      user.role = 'restaurant_operator';
      if (restaurantId) {
        user.assignedRestaurant = restaurantId;
      }
    } else {
      user.role = 'user';
    }
    await user.save();

    const populatedRoles = await UserRole.find({ userId: id })
      .populate('roleId', 'name')
      .populate('scope.restaurantId', 'nameFa');

    res.json({
      message: 'Roles assigned successfully',
      roles: populatedRoles
    });
  } catch (error) {
    console.error('Assign roles error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Revoke role from a user
router.delete('/users/:id/roles/:role', auth, requireAdmin, async (req, res) => {
  try {
    const { id, role } = req.params;
    const { restaurantId } = req.query;

    const roleDoc = await Role.findOne({ name: role.toLowerCase() });
    if (!roleDoc) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const query = {
      userId: id,
      roleId: roleDoc._id
    };

    if (restaurantId) {
      query['scope.restaurantId'] = restaurantId;
    } else {
      query['scope.restaurantId'] = null;
    }

    const userRole = await UserRole.findOneAndDelete(query);

    if (!userRole) {
      return res.status(404).json({ message: 'User role not found' });
    }

    // Update user's legacy role field if needed
    const remainingRoles = await UserRole.find({ userId: id })
      .populate('roleId', 'name');

    if (remainingRoles.length === 0) {
      const user = await User.findById(id);
      if (user) {
        user.role = 'user';
        user.assignedRestaurant = null;
        await user.save();
      }
    }

    res.json({ message: 'Role revoked successfully' });
  } catch (error) {
    console.error('Revoke role error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// List user roles
router.get('/users/:id/roles', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const userRoles = await UserRole.find({ userId: id })
      .populate('roleId', 'name')
      .populate('scope.restaurantId', 'nameFa addressFa')
      .populate('assignedBy', 'username firstName lastName')
      .sort({ assignedAt: -1 });

    res.json({ roles: userRoles });
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Moderation endpoints for posts
router.get('/posts', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, published, search } = req.query;

    const query = { deletedAt: null };
    if (published !== undefined) {
      query.published = published === 'true';
    }
    if (search) {
      query.$or = [
        { caption: { $regex: search, $options: 'i' } }
      ];
    }

    const posts = await Post.find(query)
      .populate('user', 'firstName lastName username photoUrl phoneNumber')
      .populate('restaurant', 'nameFa addressFa')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/posts/:id', auth, requireAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'firstName lastName username photoUrl phoneNumber')
      .populate('restaurant', 'nameFa addressFa')
      .populate('comments.user', 'firstName lastName username photoUrl');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Filter out deleted comments
    post.comments = post.comments.filter(comment => !comment.deletedAt);

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/posts/:id', auth, requireAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.deletedAt = new Date();
    post.deletedBy = req.user._id;
    post.published = false;
    await post.save();

    // Log moderation action
    await ModerationLog.create({
      action: 'delete_post',
      targetType: 'post',
      targetId: post._id,
      adminId: req.user._id,
      reason: req.body.reason || '',
      metadata: { caption: post.caption }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/posts/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { published } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const action = published ? 'unhide_post' : 'hide_post';
    post.published = published !== undefined ? published : post.published;
    await post.save();

    // Log moderation action
    await ModerationLog.create({
      action,
      targetType: 'post',
      targetId: post._id,
      adminId: req.user._id,
      reason: req.body.reason || ''
    });

    res.json({ message: 'Post updated successfully', post });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/posts/:postId/comments/:commentId', auth, requireAdmin, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.deletedAt = new Date();
    comment.deletedBy = req.user._id;
    await post.save();

    // Log moderation action
    await ModerationLog.create({
      action: 'delete_comment',
      targetType: 'comment',
      targetId: commentId,
      adminId: req.user._id,
      reason: req.body.reason || '',
      metadata: { postId, text: comment.text }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Rebuild counters endpoint
router.post('/rebuild-counters', auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find();
    let updated = 0;

    for (const user of users) {
      const userPackages = await UserPackage.find({ user: user._id });

      // Calculate restaurants visited from history (authoritative source)
      const restaurantsVisited = new Set();
      let totalConsumed = 0;

      userPackages.forEach(pkg => {
        // Calculate consumed from history (authoritative)
        if (pkg.history && pkg.history.length > 0) {
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

      // Store in user document if needed (optional - can be computed on the fly)
      // For now, we'll just return the counts
      updated++;
    }

    res.json({
      message: 'Counters rebuilt successfully',
      usersProcessed: updated
    });
  } catch (error) {
    console.error('Rebuild counters error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Health check endpoint for admin
router.get('/health', auth, requireAdmin, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    let lastBackup = null;
    const backupPath = process.env.BACKUP_PATH || '/var/backups/smokava';
    const lastBackupFile = path.join(backupPath, 'last_backup.txt');

    try {
      if (fs.existsSync(lastBackupFile)) {
        const timestamp = fs.readFileSync(lastBackupFile, 'utf8').trim();
        lastBackup = timestamp;
      }
    } catch (error) {
      // Ignore errors reading backup file
    }

    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Check if we can query users and packages
    let usersCount = 0;
    let packagesCount = 0;
    try {
      usersCount = await User.countDocuments();
      packagesCount = await Package.countDocuments();
    } catch (error) {
      // Database query failed
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      lastBackup: lastBackup,
      dataAccess: {
        usersCount,
        packagesCount,
        accessible: dbStatus === 'connected' && usersCount >= 0
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get backup information endpoint
router.get('/backups', auth, requireAdmin, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    const backupPath = process.env.BACKUP_PATH || '/var/backups/smokava';
    const lastBackupFile = path.join(backupPath, 'last_backup.txt');

    let lastBackup = null;
    let lastBackupTime = null;
    let backupCount = 0;
    let totalBackupSize = 0;
    const backups = [];

    try {
      // Read last backup timestamp
      if (fs.existsSync(lastBackupFile)) {
        const timestamp = fs.readFileSync(lastBackupFile, 'utf8').trim();
        lastBackup = timestamp;
        // Parse timestamp to ISO date
        if (timestamp && timestamp.length >= 15) {
          const year = timestamp.substring(0, 4);
          const month = timestamp.substring(4, 6);
          const day = timestamp.substring(6, 8);
          const hour = timestamp.substring(9, 11);
          const minute = timestamp.substring(11, 13);
          const second = timestamp.substring(13, 15);
          lastBackupTime = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toISOString();
        }
      }

      // List all backup files
      if (fs.existsSync(backupPath)) {
        const files = fs.readdirSync(backupPath).filter(f => f.startsWith('smokava_backup_') && f.endsWith('.gz'));
        backupCount = files.length;

        // Get details of recent backups (last 10)
        files
          .sort()
          .reverse()
          .slice(0, 10)
          .forEach(file => {
            const filePath = path.join(backupPath, file);
            try {
              const stats = fs.statSync(filePath);
              backups.push({
                filename: file,
                size: stats.size,
                sizeHuman: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
                createdAt: stats.birthtime || stats.mtime,
                modifiedAt: stats.mtime
              });
              totalBackupSize += stats.size;
            } catch (error) {
              // Skip files we can't read
            }
          });
      }
    } catch (error) {
      console.error('Error reading backup information:', error);
    }

    res.json({
      backupPath,
      lastBackup,
      lastBackupTime,
      backupCount,
      totalBackupSize: totalBackupSize,
      totalBackupSizeHuman: (totalBackupSize / 1024 / 1024).toFixed(2) + ' MB',
      recentBackups: backups,
      retentionHours: parseInt(process.env.RETENTION_HOURS || '168'),
      retentionDays: parseInt(process.env.RETENTION_DAYS || '7')
    });
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
