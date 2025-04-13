// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, isAdmin, logAction } = require('../middlewares/authMiddleware');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.post('/register', authenticate, isAdmin, logAction('register_user'), authController.register);
router.get('/profile', authenticate, authController.getProfile);
router.post('/logout', authenticate, authController.logout);
router.get('/officers', authenticate, isAdmin, authController.getAllOfficers);

module.exports = router;

