const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Show login page
router.get('/login', authController.showLoginPage);

// Handle login
router.post('/login', authController.login);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
