const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');
const { requireAuth } = require('../middleware/authMiddleware');

// Routes for finalization and assignment
router.post('/finalize', requireAuth, dispatchController.finalizeOrder);
router.post('/assign', requireAuth, dispatchController.assignDeliveryPartner);
router.post('/assign/:orderId', requireAuth, dispatchController.assignDeliveryPartner);
router.post('/assign-delivery-partner', requireAuth, dispatchController.assignDeliveryPartner);

module.exports = router;


