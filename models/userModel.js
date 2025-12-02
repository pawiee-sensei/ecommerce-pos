const pool = require('../config/db');

// User model for DB queries
module.exports = {
  // Find user by username or email
  findByUsernameOrEmail: async (identifier) => {
    const sql = `
      SELECT * FROM users 
      WHERE username = ? OR username = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [identifier, identifier]);
    return rows[0] || null;
  },

  // Create new user
  createUser: async ({ username, password, role = 'staff' }) => {
    const sql = `
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(sql, [username, password, role]);
    return result.insertId;
  }
};
