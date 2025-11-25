const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Post = require('../models/Post');
const UserPackage = require('../models/UserPackage');
const Package = require('../models/Package');
const auth = require('../middleware/auth');

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
  console.log('requireAdmin check - req.user:', req.user ? { id: req.user._id, role: req.user.role } : 'none');

  // Explicitly deny restaurant operators
  if (req.user && req.user.role === 'restaurant_operator') {
    console.log('❌ Restaurant operator access denied to admin routes');
    return res.status(403).json({
      message: 'Access denied. Restaurant operators cannot access admin features.'
    });
  }

  // Check if user has admin role in token
  if (req.user && req.user.role === 'admin') {
    console.log('✅ Admin access granted');
    return next();
  }

  console.log('❌ Admin access denied');
  return res.status(403).json({
    message: 'Access denied. Admin only.'
  });
};

// Get dashboard statistics
router.get('/dashboard/stats', auth, requireAdmin, async (req, res) => {
  try {
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

    res.json({
      totalUsers,
      totalRestaurants,
      totalPosts,
      totalPackages,
      totalConsumed,
      recentUsers
    });
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
    const { page = 1, limit = 20 } = req.query;

    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-otpCode -otpExpiresAt');

    const total = await User.countDocuments();

    res.json({
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

    // Calculate stats
    const totalConsumed = userPackages.reduce((sum, pkg) => {
      return sum + (pkg.totalCount - pkg.remainingCount);
    }, 0);

    const restaurantsVisited = new Set();
    userPackages.forEach(pkg => {
      pkg.history.forEach(item => {
        if (item.restaurant) {
          restaurantsVisited.add(item.restaurant._id.toString());
        }
      });
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
    const { page = 1, limit = 20 } = req.query;

    const userPackages = await UserPackage.find()
      .populate('user', 'name phoneNumber')
      .populate('package', 'nameFa count price')
      .sort({ purchasedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await UserPackage.countDocuments();

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
    console.error('Get sold packages error:', error);
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
    const package = await Package.findById(req.params.id);

    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    const pkgObj = package.toObject ? package.toObject() : package;
    res.json({
      ...pkgObj,
      _id: package._id.toString()
    });
  } catch (error) {
    console.error('Get package by ID error:', error);
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

    if (feature_usage_fa !== undefined) {
      package.feature_usage_fa = feature_usage_fa;
    }

    if (feature_validity_fa !== undefined) {
      package.feature_validity_fa = feature_validity_fa;
    }

    if (feature_support_fa !== undefined) {
      package.feature_support_fa = feature_support_fa;
    }

    if (package_icon !== undefined) {
      package.package_icon = package_icon;
    }

    await package.save();

    const pkgObj = package.toObject ? package.toObject() : package;
    res.json({
      ...pkgObj,
      _id: package._id.toString()
    });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
