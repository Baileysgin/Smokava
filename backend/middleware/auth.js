const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    console.log('🔍 Auth middleware - Decoded token:', {
      hasRole: !!decoded.role,
      role: decoded.role,
      hasAdminId: !!decoded.adminId,
      hasUserId: !!decoded.userId,
      adminId: decoded.adminId,
      userId: decoded.userId
    });

    // Check if admin FIRST (before checking userId)
    // Admin tokens have: { adminId, role: 'admin' }
    if (decoded.adminId) {
      console.log('🔍 Checking admin token with adminId:', decoded.adminId);
      const admin = await Admin.findById(decoded.adminId);
      if (!admin) {
        console.log('❌ Admin not found for adminId:', decoded.adminId);
        return res.status(401).json({ message: 'Token is not valid' });
      }
      // Convert mongoose document to plain object and add role
      const adminObj = admin.toObject ? admin.toObject() : admin;
      adminObj.role = 'admin'; // Explicitly set admin role
      adminObj._id = adminObj._id.toString();
      console.log('✅ Admin authenticated:', { id: adminObj._id, role: adminObj.role });
      req.user = adminObj;
      return next();
    }

    // Check if regular user or restaurant operator
    // User tokens have: { userId, role?: 'restaurant_operator' }
    if (decoded.userId) {
      console.log('🔍 Checking user token with userId:', decoded.userId);
      const user = await User.findById(decoded.userId).populate('assignedRestaurant');
      if (!user) {
        console.log('❌ User not found for userId:', decoded.userId);
        return res.status(401).json({ message: 'Token is not valid' });
      }
      // Convert to plain object and ensure role is set
      const userObj = user.toObject ? user.toObject() : user;
      if (user.role) {
        userObj.role = user.role;
      }
      console.log('✅ User authenticated:', { id: userObj._id, role: userObj.role || 'user' });
      req.user = userObj;
      return next();
    }

    console.log('❌ Token has neither adminId nor userId');
    return res.status(401).json({ message: 'Token is not valid' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
