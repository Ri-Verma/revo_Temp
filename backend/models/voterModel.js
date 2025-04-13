// models/voterModel.js
const db = require('../config/db');
const { encryptFingerprint } = require('../utils/fingerprintUtils');

class VoterModel {
  // Register a new voter
  async register(voterData) {
    const { voter_id, name, age, nationality, fingerprint } = voterData;
    
    // Encrypt the fingerprint data
    const encryptedFingerprint = encryptFingerprint(fingerprint);
    
    const query = `
      INSERT INTO voters (voter_id, name, age, nationality, fingerprint)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, voter_id, name, age, nationality, status
    `;
    
    const result = await db.query(query, [voter_id, name, age, nationality, encryptedFingerprint]);
    return result.rows[0];
  }

  // Get voter by ID
  async findByVoterId(voterId) {
    const query = 'SELECT * FROM voters WHERE voter_id = $1';
    const result = await db.query(query, [voterId]);
    return result.rows[0];
  }

  // Update voter verification status
  async updateStatus(voterId, status, officerId) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update the voter status
      const updateQuery = `
        UPDATE voters 
        SET status = $1, verified_at = CURRENT_TIMESTAMP
        WHERE voter_id = $2
        RETURNING id, voter_id, name, status
      `;
      const voterResult = await client.query(updateQuery, [status, voterId]);
      
      // Create verification record
      const verificationQuery = `
        INSERT INTO verifications (voter_id, officer_id, status)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      await client.query(verificationQuery, [voterId, officerId, status]);
      
      await client.query('COMMIT');
      return voterResult.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Get voters with pagination and filters
  async getVoters(filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    let query = 'SELECT id, voter_id, name, age, nationality, status, verified_at FROM voters';
    const queryParams = [];
    const conditions = [];
    
    // Build filter conditions
    if (filters.status) {
      conditions.push(`status = $${queryParams.length + 1}`);
      queryParams.push(filters.status);
    }
    
    if (filters.nationality) {
      conditions.push(`nationality = $${queryParams.length + 1}`);
      queryParams.push(filters.nationality);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Add pagination
    query += ` ORDER BY id DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM voters';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const countResult = await db.query(countQuery, queryParams.slice(0, conditions.length));
    const totalCount = parseInt(countResult.rows[0].count);
    
    return {
      voters: result.rows,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  // Get verification statistics
  async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'verified') as verified_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) as total_count
      FROM voters
    `;
    
    const result = await db.query(query);
    return result.rows[0];
  }
}

module.exports = new VoterModel();

