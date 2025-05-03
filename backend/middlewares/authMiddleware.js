const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const logModel = require('../models/logModel');

// Authenticate JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await userModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    next(err);
  }
};

// Check if user has admin role
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// Check if user has officer or admin role
const isOfficer = (req, res, next) => {
  if (!req.user || (req.user.role !== 'officer' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Access denied. Officer role required.' });
  }
  next();
};

// Log user actions
const logAction = (actionType) => {
  return async (req, res, next) => {
    // Store the original send function
    const originalSend = res.send;
    
    // Override the send function
    res.send = function(body) {
      // Restore the original send function
      res.send = originalSend;
      
      // Create log only for successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const logData = {
          user_id: req.user ? req.user.id : null,
          voter_id: req.params.voterId || req.body.voter_id || null,
          action_type: actionType,
          status_change: req.body.status ? `${req.body.currentStatus || 'pending'} → ${req.body.status}` : null,
          message: `${req.user ? req.user.username : 'System'} performed ${actionType} action`
        };
        
        // Don't await to avoid blocking response
        logModel.create(logData).catch(err => console.error('Logging error:', err));
      }
      
      // Call the original send function
      return originalSend.call(this, body);
    };
    
    next();
  };
};

module.exports = {
  authenticate,
  isAdmin,
  isOfficer,
  logAction
};

