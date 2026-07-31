const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');

// Routes for driver actions
router.get('/orders/ready', driverController.getReadyOrders);
router.patch('/order/:order_id/deliver', driverController.deliverOrder);

module.exports = router;
