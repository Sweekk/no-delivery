const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');

// Routes for finalization and assignment
router.post('/finalize', dispatchController.finalizeOrder);
router.post('/assign', dispatchController.assignDeliveryPartner);
router.post('/assign/:orderId', dispatchController.assignDeliveryPartner);
router.post('/assign-delivery-partner', dispatchController.assignDeliveryPartner);

module.exports = router;

