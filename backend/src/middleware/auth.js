const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug log
    
    if (!decoded.userId) {
      console.error('Token missing user ID');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Find user in database
    const user = await User.findById(decoded.userId);
    console.log('Found user:', user ? 'Yes' : 'No'); // Debug log
    
    if (!user) {
      console.error('User not found for ID:', decoded.userId);
      return res.status(401).json({ 
        message: 'User not found. Please login again.',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    res.status(401).json({ 
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};

const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      console.log('Validating input:', req.body); // Debug log
      const result = schema.parse(req.body);
      console.log('Validation result:', result); // Debug log
      next();
    } catch (error) {
      console.error('Validation error:', error.errors); // Debug log
      res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.errors,
        code: 'VALIDATION_FAILED'
      });
    }
  };
};

module.exports = {
  auth,
  checkRole,
  validateInput
}; 