const pool = require('../config/db');

module.exports = {

  // CREATE PRODUCT (unchanged)
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

  // GET ALL PRODUCTS (legacy call, still available)
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
  },

  // ============================
  // NEW: UPDATE STOCK ONLY
  // ============================
  updateStock: async (id, newStock) => {
    const sql = `
      UPDATE products
      SET stock = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [newStock, id]);
    return result.affectedRows;
  },

  // ============================
  // NEW: GET AVERAGE DAILY USAGE (last N days)
  // ============================
  getAverageDailyUsage: async (productId, days = 30) => {
    const sql = `
      SELECT 
        SUM(
          CASE 
            WHEN action IN ('sale', 'deduct') THEN qty 
            ELSE 0 
          END
        ) AS outgoing
      FROM stock_logs
      WHERE product_id = ?
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;

    const [rows] = await pool.query(sql, [productId, days]);
    const totalOutgoing = rows[0]?.outgoing || 0;

    if (totalOutgoing <= 0) return 0;

    return totalOutgoing / days;
  },

  // ============================
  // NEW: FULL FILTER + PAGINATION SUPPORT
  // ============================
  getFilteredProducts: async ({ q, category_id, sort, page, per_page }) => {
    let where = `WHERE 1 `;
    let params = [];

    // Search
    if (q) {
      where += `AND p.name LIKE ? `;
      params.push(`%${q}%`);
    }

    // Category filter
    if (category_id) {
      where += `AND p.category_id = ? `;
      params.push(category_id);
    }

    // Sorting
    let order = `ORDER BY p.created_at DESC`;

    if (sort === "price_asc") order = `ORDER BY p.price ASC`;
    if (sort === "price_desc") order = `ORDER BY p.price DESC`;
    if (sort === "stock_asc") order = `ORDER BY p.stock ASC`;
    if (sort === "stock_desc") order = `ORDER BY p.stock DESC`;

    // Pagination
    const offset = (page - 1) * per_page;

    const sql = `
      SELECT 
        p.*,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
      ${order}
      LIMIT ? OFFSET ?
    `;

    params.push(per_page, offset);

    const [rows] = await pool.query(sql, params);

    return rows;
  },

  // ============================
  // NEW: COUNT TOTAL RESULTS
  // ============================
  countFilteredProducts: async ({ q, category_id }) => {
    let where = `WHERE 1 `;
    let params = [];

    if (q) {
      where += `AND name LIKE ? `;
      params.push(`%${q}%`);
    }

    if (category_id) {
      where += `AND category_id = ? `;
      params.push(category_id);
    }

    const sql = `
      SELECT COUNT(*) AS total
      FROM products
      ${where}
    `;

    const [rows] = await pool.query(sql, params);
    return rows[0].total;
  }

};
