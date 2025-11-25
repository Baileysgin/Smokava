const auth = require('./auth');

// Middleware to check if user is a restaurant operator
const requireOperator = (req, res, next) => {
  // First check authentication
  auth(req, res, () => {
    // Check if user has restaurant_operator role
    if (req.user && req.user.role === 'restaurant_operator') {
      // Check if operator has assigned restaurant
      if (!req.user.assignedRestaurant) {
        return res.status(403).json({
          message: 'Restaurant operator must have an assigned restaurant'
        });
      }
      return next();
    }

    return res.status(403).json({
      message: 'Access denied. Restaurant operator only.'
    });
  });
};

module.exports = requireOperator;
