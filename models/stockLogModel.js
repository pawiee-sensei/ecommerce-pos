const pool = require('../config/db');

module.exports = {

  // CREATE LOG ENTRY
  log: async (data) => {
    const sql = `
      INSERT INTO stock_logs
      (product_id, action, qty, previous_stock, new_stock, reason, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.product_id,
      data.action,
      data.qty,
      data.previous_stock,
      data.new_stock,
      data.reason || null,
      data.user_id || null
    ];

    await pool.query(sql, params);
  },

  // GET ALL LOGS (JOIN product & user)
  getAllLogs: async () => {
    const sql = `
      SELECT 
        l.id,
        l.product_id,
        p.name AS product_name,
        p.image_path,
        l.action,
        l.qty,
        l.previous_stock,
        l.new_stock,
        l.reason,
        u.username AS user_name,
        l.created_at
      FROM stock_logs l
      LEFT JOIN products p ON l.product_id = p.id
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `;

    const [rows] = await pool.query(sql);
    return rows;
  }

};
