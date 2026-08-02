const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');

// Routes for Order Lifecycle Management
router.post('/', ordersController.createOrder);
router.get('/:id', ordersController.getOrderDetails);
router.patch('/:id/status', ordersController.updateOrderStatus);
router.patch('/:id/items/:itemId/status', ordersController.updateItemStatus);
router.patch('/:id/items/:itemId/decision', ordersController.handleCustomerDecision);

module.exports = router;
