// models/userModel.js
const db = require('../config/db');
const { hashPassword } = require('../utils/encrypt');

class UserModel {
  // Create a new user (admin or officer)
  async create(username, password, role) {
    const hashedPassword = await hashPassword(password);
    const query = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role';
    const result = await db.query(query, [username, hashedPassword, role]);
    return result.rows[0];
  }

  // Find user by username
  async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await db.query(query, [username]);
    return result.rows[0];
  }

  // Find user by ID
  async findById(id) {
    const query = 'SELECT id, username, role FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Get all officers (for admin dashboard)
  async getAllOfficers() {
    const query = 'SELECT id, username FROM users WHERE role = $1';
    const result = await db.query(query, ['officer']);
    return result.rows;
  }
}

module.exports = new UserModel();
