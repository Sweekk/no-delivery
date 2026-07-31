const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');

// Routes for Delivery Partner Module
router.get('/orders', deliveryController.getAssignedOrders);
router.post('/issues', deliveryController.reportIssue);
router.get('/profile', deliveryController.getProfile);
router.post('/location', deliveryController.updateLocation);

module.exports = router;
