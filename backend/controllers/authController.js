// controllers/authController.js
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { verifyPassword } = require('../utils/encrypt');
const logModel = require('../models/logModel');

// Login for admin and officer
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Find user by username
    const user = await userModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(user.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    // Log successful login
    await logModel.create({
      user_id: user.id,
      action_type: 'login',
      message: `User ${username} logged in`
    });
    
    // Return user info and token
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      token
    });
  } catch (err) {
    next(err);
  }
};

// Register new user (admin only)
const register = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    
    // Validate input
    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Username, password and role are required' });
    }
    
    if (role !== 'admin' && role !== 'officer') {
      return res.status(400).json({ message: 'Role must be either admin or officer' });
    }
    
    // Create new user
    const newUser = await userModel.create(username, password, role);
    
    // Log user creation
    await logModel.create({
      user_id: req.user.id,
      action_type: 'create_user',
      message: `Created new ${role} account: ${username}`
    });
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (err) {
    // Handle duplicate username
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Username already exists' });
    }
    next(err);
  }
};

// Get user profile
const getProfile = async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
};

// Logout (just for logging purposes)
const logout = async (req, res, next) => {
  try {
    // Log the logout action
    await logModel.create({
      user_id: req.user.id,
      action_type: 'logout',
      message: `User ${req.user.username} logged out`
    });
    
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// Get all officers (admin only)
const getAllOfficers = async (req, res, next) => {
  try {
    const officers = await userModel.getAllOfficers();
    res.json({ officers });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  register,
  getProfile,
  logout,
  getAllOfficers
};

