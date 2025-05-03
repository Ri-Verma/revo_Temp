const voterModel = require('../models/voterModel');
const logModel = require('../models/logModel');

// Get dashboard statistics
const getDashboardStats = async (req, res, next) => {
  try {
    // Get voter statistics
    const voterStats = await voterModel.getStatistics();
    
    // Get recent activity
    const recentActivity = await logModel.getRecentActivity(10);
    
    res.json({
      statistics: voterStats,
      recentActivity
    });
  } catch (err) {
    next(err);
  }
};

// Get recent logs with pagination
const getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const logs = await logModel.getLogs(parseInt(page), parseInt(limit));
    
    res.json({ logs });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getActivityLogs
};