const db = require('../config/db');

class LogModel {
  // Create a new log entry
  async create(logData) {
    const { user_id, voter_id, action_type, status_change, message } = logData;
    
    const query = `
      INSERT INTO logs (user_id, voter_id, action_type, status_change, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, action_type, timestamp
    `;
    
    const result = await db.query(query, [user_id, voter_id, action_type, status_change, message]);
    return result.rows[0];
  }

  // Get recent logs with pagination
  async getLogs(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT l.id, l.action_type, l.status_change, l.message, l.timestamp,
             u.username as user_username, u.role as user_role,
             v.name as voter_name
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN voters v ON l.voter_id = v.voter_id
      ORDER BY l.timestamp DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  // Get logs for a specific voter
  async getVoterLogs(voterId) {
    const query = `
      SELECT l.id, l.action_type, l.status_change, l.message, l.timestamp,
             u.username as user_username, u.role as user_role
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.voter_id = $1
      ORDER BY l.timestamp DESC
    `;
    
    const result = await db.query(query, [voterId]);
    return result.rows;
  }

  // Get recent activity for dashboard
  async getRecentActivity(limit = 10) {
    const query = `
      SELECT l.id, l.action_type, l.status_change, l.message, l.timestamp,
             u.username as user_username, u.role as user_role,
             v.name as voter_name
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN voters v ON l.voter_id = v.voter_id
      ORDER BY l.timestamp DESC
      LIMIT $1
    `;
    
    const result = await db.query(query, [limit]);
    return result.rows;
  }
}

module.exports = new LogModel();