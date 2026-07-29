const express = require('express');
const router = express.Router();
const pickerController = require('../controllers/pickerController');

// Routes for picker actions
router.get('/orders', pickerController.getOrders);
router.get('/active-run', pickerController.getActiveRun);
router.post('/item-not-found', pickerController.handleNotFound);
router.get('/order/:order_id', pickerController.getOrderForPicker);
router.patch('/order/:order_id/status', pickerController.updateOrderStatus);
router.patch('/item/:list_id', pickerController.updateItemStatus);
router.post('/order/:order_id/complete', pickerController.completeOrder);

module.exports = router