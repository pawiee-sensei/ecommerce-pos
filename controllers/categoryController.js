const categoryModel = require('../models/categoryModel');

module.exports = {

  // FETCH ALL CATEGORIES
  list: async (req, res) => {
    try {
      const categories = await categoryModel.getAllCategories();
      return res.json({ success: true, categories });
    } catch (err) {
      console.error("Category list error:", err);
      res.status(500).json({ success: false });
    }
  },

  // CREATE NEW CATEGORY
  create: async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name || name.trim() === "") {
        return res.json({ success: false, message: "Name is required" });
      }

      const id = await categoryModel.createCategory(name.trim(), description || null);

      res.json({
        success: true,
        message: "Category created",
        category_id: id
      });

    } catch (err) {
      console.error("Create category error:", err);
      res.status(500).json({ success: false });
    }
  },

  // UPDATE CATEGORY
  update: async (req, res) => {
    try {
      const id = req.params.id;
      const { name, description } = req.body;

      await categoryModel.updateCategory(id, name, description);

      res.json({ success: true, message: "Category updated" });

    } catch (err) {
      console.error("Update category error:", err);
      res.status(500).json({ success: false });
    }
  },

  // DELETE CATEGORY
  delete: async (req, res) => {
    try {
      const id = req.params.id;
      await categoryModel.deleteCategory(id);
      res.json({ success: true, message: "Category deleted" });
    } catch (err) {
      console.error("Delete category error:", err);
      res.status(500).json({ success: false });
    }
  }

};
