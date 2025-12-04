const express = require('express');
const router = express.Router();

const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const stockLogController = require('../controllers/stockLogController');

// LIST ALL STOCK LOGS
router.get('/list', ensureAuthenticated, ensureAdmin, stockLogController.getLogs);

module.exports = router;
