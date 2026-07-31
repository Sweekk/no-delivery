const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/delivery-login
router.post('/delivery-login', authController.deliveryLogin);

module.exports = router;
