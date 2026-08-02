const express = require('express');
const router = express.Router();
const customerOrderController = require('../controllers/customerOrderController');
const customerController = require('../controllers/customerController');

// Route for checkout/order placement
router.post('/order', customerOrderController.createCustomerOrder);
router.post('/orders', customerOrderController.createCustomerOrder);

// Route to fetch stores for checkout UI
router.get('/stores', customerOrderController.getStores);

// Route for customer to resolve a replacement/skip action
router.patch('/item/:list_id/resolve', customerController.resolveItemAction);

// Route for customer app to poll order status
router.get('/order/:order_id/status', customerController.getOrderStatus);
router.get('/order/:order_id', customerController.getOrderStatus);

module.exports = router;
