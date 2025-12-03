const express = require('express');
const router = express.Router();

const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const productController = require('../controllers/productController');

// EXISTING ROUTES
router.post('/add', ensureAuthenticated, ensureAdmin, upload.single('image'), productController.addProduct);
router.get('/list', ensureAuthenticated, ensureAdmin, productController.getProducts);

// GET PRODUCT BY ID
router.get('/get/:id', ensureAuthenticated, ensureAdmin, productController.getProductById);

// UPDATE PRODUCT
router.post('/update/:id', ensureAuthenticated, ensureAdmin, upload.single('image'), productController.updateProduct);

// ADJUST STOCK
router.post('/stock/:id', ensureAuthenticated, ensureAdmin, productController.adjustStock);

module.exports = router;
