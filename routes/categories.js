const express = require('express');
const router = express.Router();

const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

// LIST ALL CATEGORIES
router.get('/list', ensureAuthenticated, ensureAdmin, categoryController.list);

// ADD CATEGORY
router.post('/add', ensureAuthenticated, ensureAdmin, categoryController.create);

// UPDATE CATEGORY
router.post('/update/:id', ensureAuthenticated, ensureAdmin, categoryController.update);

// DELETE CATEGORY
router.post('/delete/:id', ensureAuthenticated, ensureAdmin, categoryController.delete);

module.exports = router;
