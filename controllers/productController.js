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
      const products = await productModel.getAllProducts();

      return res.json({
        success: true,
        products
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
