const express = require('express');
const router = express.Router();
const pickerController = require('../controllers/pickerController');

// Standard endpoints
router.get('/orders/pending', pickerController.getPendingOrders);
router.get('/orders', pickerController.getPendingOrders);
router.get('/pending', pickerController.getPendingOrders);

// Order claim
router.post('/order/:order_id/claim', pickerController.claimOrder);
router.post('/:order_id/claim', pickerController.claimOrder);

// Order completion
router.post('/order/:order_id/complete', pickerController.completeOrder);
router.post('/:order_id/complete', pickerController.completeOrder);

// Order details
router.get('/order/:order_id', pickerController.getOrderDetails);
router.get('/:order_id', pickerController.getOrderDetails);

// Item status update
router.patch('/item/:list_id', pickerController.updateItemStatus);
router.patch('/:list_id', pickerController.updateItemStatus);

// Legacy aliases
router.get('/active-run', pickerController.getPendingOrders);
router.post('/item-not-found', pickerController.updateItemStatus);

module.exports = router