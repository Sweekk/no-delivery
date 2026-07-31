const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Routes for checkout and order payload management
router.post('/', orderController.createOrder);
router.get('/:id', orderController.getOrder);

module.exports = router;
