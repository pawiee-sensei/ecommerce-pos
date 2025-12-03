const pool = require('../config/db');

module.exports = {

  // CREATE PRODUCT
  createProduct: async (data) => {
    const sql = `
      INSERT INTO products 
      (sku, name, description, price, cost, category_id, image_path, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.sku,
      data.name,
      data.description,
      data.price,
      data.cost,
      data.category_id || null,
      data.image_path || null,
      data.stock
    ];

    const [result] = await pool.query(sql, params);
    return result.insertId;
  },

  // GET ALL PRODUCTS
  getAllProducts: async () => {
    const sql = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  },

  // GET PRODUCT BY ID
  getProductById: async (id) => {
    const sql = `SELECT * FROM products WHERE id = ? LIMIT 1`;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  // UPDATE PRODUCT
  updateProduct: async (id, data) => {
    const sql = `
      UPDATE products
      SET name = ?, description = ?, price = ?, cost = ?, category_id = ?, image_path = ?
      WHERE id = ?
    `;

    const params = [
      data.name,
      data.description,
      data.price,
      data.cost,
      data.category_id || null,
      data.image_path || null,
      id
    ];

    const [result] = await pool.query(sql, params);
    return result.affectedRows;
  },

  // DELETE PRODUCT
  deleteProduct: async (id) => {
    const sql = `DELETE FROM products WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows;
  }
};
