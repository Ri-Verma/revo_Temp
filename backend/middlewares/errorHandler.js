// middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    // Database connection errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(500).json({
        status: 'error',
        message: 'Database connection error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  
    // Database constraint errors
    if (err.code === '23505') { // Unique violation in PostgreSQL
      return res.status(409).json({
        status: 'error',
        message: 'Record already exists',
        error: process.env.NODE_ENV === 'development' ? err.detail : undefined
      });
    }
  
    // JWT errors are handled by auth middleware
    
    // Default error response
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      status: 'error',
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  };
  
  module.exports = errorHandler;