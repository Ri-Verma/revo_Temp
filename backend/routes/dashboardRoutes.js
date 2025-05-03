const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, isOfficer } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Dashboard routes (available to both admin and officers)
router.get('/stats', isOfficer, dashboardController.getDashboardStats);
router.get('/logs', isOfficer, dashboardController.getActivityLogs);

module.exports = router;