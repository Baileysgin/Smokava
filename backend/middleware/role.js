// Role-based middleware helpers

/**
 * Middleware to check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Check if user has admin role (from User model or Admin model)
  if (req.user.role === 'admin' || req.user.adminId) {
    return next();
  }

  return res.status(403).json({ message: 'Admin access required' });
};

/**
 * Middleware to check if user is operator (optionally scoped to restaurant)
 */
const isOperator = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Check if user has operator role
  if (req.user.role === 'restaurant_operator' || req.user.role === 'operator') {
    // If restaurantId is required in query/params, check scope
    const restaurantId = req.params.restaurantId || req.query.restaurantId || req.body.restaurantId;

    if (restaurantId && req.user.assignedRestaurant) {
      // Check if operator is assigned to this restaurant
      if (req.user.assignedRestaurant.toString() !== restaurantId.toString()) {
        return res.status(403).json({
          message: 'Access denied. Operator not assigned to this restaurant'
        });
      }
    }

    return next();
  }

  return res.status(403).json({ message: 'Operator access required' });
};

/**
 * Middleware to check if user is admin or operator
 */
const isAdminOrOperator = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role === 'admin' || req.user.role === 'restaurant_operator' || req.user.role === 'operator' || req.user.adminId) {
    return next();
  }

  return res.status(403).json({ message: 'Admin or operator access required' });
};

module.exports = {
  isAdmin,
  isOperator,
  isAdminOrOperator
};

