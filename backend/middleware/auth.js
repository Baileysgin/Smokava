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

    // Check if admin
    if (decoded.role === 'admin' && decoded.adminId) {
      const admin = await Admin.findById(decoded.adminId);
      if (!admin) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      // Convert mongoose document to plain object and add role
      const adminObj = admin.toObject ? admin.toObject() : admin;
      adminObj.role = 'admin';
      adminObj._id = adminObj._id.toString();
      req.user = adminObj;
      return next();
    }

    // Check if regular user or restaurant operator
    if (decoded.userId) {
      const user = await User.findById(decoded.userId).populate('assignedRestaurant');
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      // Convert to plain object and ensure role is set
      const userObj = user.toObject ? user.toObject() : user;
      if (user.role) {
        userObj.role = user.role;
      }
      req.user = userObj;
      return next();
    }

    return res.status(401).json({ message: 'Token is not valid' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
