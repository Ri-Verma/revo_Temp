require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/authRoutes');
const voterRoutes = require('./routes/voterRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Import middleware
const errorHandler = require('./middlewares/errorHandler');
const { authenticate } = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5006;

// Middleware
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for fingerprint data
app.use(morgan('dev')); // Logging

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});


// Make DB pool available to the application
app.locals.pool = pool;

// Export the pool configuration so it can be imported in db.js


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/dashboard', dashboardRoutes);


// Keep your existing endpoints for backward compatibility
// Fetch voter stats (Updated for PostgreSQL)
app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total_voters,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) AS verified,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
      FROM voters;
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// Fetch a voter by ID
app.get('/verify/:voterId', async (req, res) => {
  const { voterId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM voters WHERE voter_id = $1", [voterId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Voter not found" });
    }
    
    // Remove sensitive data like fingerprint before sending response
    const { fingerprint, ...voterData } = result.rows[0];
    res.json(voterData);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: "Database error" });
  }
});


// Global error handler
app.use(errorHandler);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));