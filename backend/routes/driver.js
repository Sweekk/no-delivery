const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');

// Routes for driver actions
router.get('/orders/ready', driverController.getReadyOrders);
router.get('/ready-orders', driverController.getReadyOrders);
router.patch('/order/:order_id/deliver', driverController.deliverOrder);
router.patch('/order/:order_id/delivered', driverController.deliverOrder);

module.exports = router;
