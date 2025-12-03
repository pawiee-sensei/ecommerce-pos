const pool = require('../config/db');

module.exports = {

  // CREATE CATEGORY
  createCategory: async (name, description) => {
    const sql = `
      INSERT INTO categories (name, description)
      VALUES (?, ?)
    `;
    const [result] = await pool.query(sql, [name, description]);
    return result.insertId;
  },

  // GET ALL CATEGORIES
  getAllCategories: async () => {
    const sql = `
      SELECT id, name, description
      FROM categories
      ORDER BY name ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  },

  // GET ONE CATEGORY
  getCategoryById: async (id) => {
    const sql = `SELECT * FROM categories WHERE id = ?`;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  // UPDATE CATEGORY
  updateCategory: async (id, name, description) => {
    const sql = `
      UPDATE categories
      SET name = ?, description = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [name, description, id]);
    return result.affectedRows;
  },

  // DELETE CATEGORY
  deleteCategory: async (id) => {
    const sql = `DELETE FROM categories WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows;
  }

};
