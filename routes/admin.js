const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Admin shell route
router.get('/', ensureAuthenticated, ensureAdmin, adminController.showAdmin);

// Load panels dynamically (dashboard, products, pos, strategy)
router.get('/panel/:panel', ensureAuthenticated, ensureAdmin, adminController.loadPanel);

router.get('/panel/stocklogs', ensureAuthenticated, ensureAdmin, (req, res) => {
  res.render('admin/panels/stockLogs');
});

module.exports = router;
