const productModel = require('../models/productModel');
const stockLogModel = require('../models/stockLogModel'); // will be generated in Batch 4
const upload = require('../middleware/upload');

module.exports = {

  // ============================
  // ADD PRODUCT
  // ============================
  addProduct: async (req, res) => {
    try {
      const { name, price, cost, description, category_id, stock } = req.body;

      const sku = "SKU-" + Date.now();

      let imagePath = null;
      if (req.file) {
        imagePath = '/public/uploads/products/' + req.file.filename;
      }

      const productId = await productModel.createProduct({
        sku,
        name,
        price,
        cost,
        description,
        category_id,
        image_path: imagePath,
        stock
      });

      return res.json({
        success: true,
        message: "Product created",
        product_id: productId
      });

    } catch (err) {
      console.error("Add product error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // ============================
  // GET ALL PRODUCTS
  // ============================
  getProducts: async (req, res) => {
  try {
    const q = req.query.q || "";
    const category_id = req.query.category_id || "";
    const sort = req.query.sort || "";
    const page = parseInt(req.query.page) || 1;
    const per_page = parseInt(req.query.per_page) || 20;

    // Fetch rows
    const products = await productModel.getFilteredProducts({
      q,
      category_id,
      sort,
      page,
      per_page
    });

    // Compute usage & notes for each product
    for (let p of products) {
      const avg = await productModel.getAverageDailyUsage(p.id, 30);
      p.average_daily_usage = avg;

      if (avg > 0) {
        p.days_left = Number((p.stock / avg).toFixed(1));
      } else {
        p.days_left = null;
      }

      // Notes classification
      p.notes = [];

      if (avg >= 5) p.notes.push("Fast-moving");
      if (avg > 0 && avg < 1) p.notes.push("Slow-moving");
      if (p.days_left !== null && p.days_left < 3) p.notes.push("Restock soon");
      if (p.stock === 0) p.notes.push("Out of stock");
      if (avg === 0) p.notes.push("No sales recently");
    }

    // Pagination meta
    const total_items = await productModel.countFilteredProducts({ q, category_id });
    const total_pages = Math.ceil(total_items / per_page);

    return res.json({
      success: true,
      products,
      meta: {
        page,
        per_page,
        total_items,
        total_pages
      }
    });

  } catch (err) {
    console.error("Fetch products error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
},


  // ============================
  // GET PRODUCT BY ID
  // ============================
  getProductById: async (req, res) => {
    try {
      const id = req.params.id;
      const product = await productModel.getProductById(id);

      return res.json({ success: true, product });

    } catch (err) {
      console.error("Get product error:", err);
      res.status(500).json({ success: false });
    }
  },

  // ============================
  // UPDATE PRODUCT DETAILS
  // ============================
  updateProduct: async (req, res) => {
    try {
      const id = req.params.id;

      let imagePath = req.body.existing_image;
      if (req.file) {
        imagePath = '/public/uploads/products/' + req.file.filename;
      }

      await productModel.updateProduct(id, {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        cost: req.body.cost,
        category_id: req.body.category_id,
        image_path: imagePath
      });

      res.json({ success: true, message: "Product updated" });

    } catch (err) {
      console.error("Update product error:", err);
      res.status(500).json({ success: false });
    }
  },

  // ============================
  // STOCK ADJUST — ADD OR DEDUCT
  // ============================
  adjustStock: async (req, res) => {
    try {
      const id = req.params.id;
      const { qty, type, reason } = req.body;
      const userId = req.session.user.id;

      const product = await productModel.getProductById(id);
      const previous = product.stock;

      let newStock = previous;

      if (type === "add") newStock += parseInt(qty);
      if (type === "deduct") newStock -= parseInt(qty);

      if (newStock < 0) {
        return res.json({ success: false, message: "Stock cannot be negative" });
      }

      await productModel.updateStock(id, newStock);

      await stockLogModel.log({
        product_id: id,
        action: type,
        qty,
        previous_stock: previous,
        new_stock: newStock,
        reason,
        user_id: userId
      });

      res.json({ success: true });

    } catch (err) {
      console.error("Adjust stock error:", err);
      res.status(500).json({ success: false });
    }
  },

  // ============================
  // DELETE PRODUCT
  // ============================
  deleteProduct: async (req, res) => {
    try {
      const id = req.params.id;

      const deleted = await productModel.deleteProduct(id);

      if (!deleted) {
        return res.json({ success: false, message: "Product not found" });
      }

      return res.json({ success: true, message: "Product deleted" });

    } catch (err) {
      console.error("Delete product error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

};
